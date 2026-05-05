import { getSupabase } from "../shared/supabase.js";
import { logger } from "../shared/logger.js";
import { embedTexts } from "../shared/embed.js";
import { withRun } from "../shared/runs.js";
import { fetchOddsForSportKey, fetchActiveSportKeys, type OddsApiEvent } from "../shared/sources/oddsapi.js";
import { fetchRss, type RssItem } from "../shared/sources/rss.js";

// Pipeline d'ingestion tennis. Phase 1 : on s'appuie sur the-odds-api pour
// découvrir dynamiquement les tournois actifs (les sport_keys changent toutes les
// semaines : tennis_atp_<event>, tennis_wta_<event>).
//
// On stocke les joueurs dans `teams` (1 row par joueur). Pour distinguer ATP/WTA
// on crée 2 ligues fixes : 'atp' et 'wta'. Le tournoi exact est conservé dans
// fixtures.ext_ids->>'tournament'.

const NEWS_FEEDS = [
  { url: "https://www.atptour.com/en/media/rss-feed/xml-feed", source: "atptour" },
  { url: "https://www.wtatennis.com/rss/news", source: "wta" },
];

export async function ingestTennis(): Promise<void> {
  await withRun("tennis", "ingest", async (runId, metrics) => {
    let fixturesUpserted = 0;
    let oddsInserted = 0;
    let newsInserted = 0;

    // 1. Ligues ATP / WTA (fixes ; un sub-tournoi est une dimension de fixture)
    const atpId = await upsertLeague("atp", "ATP Tour");
    const wtaId = await upsertLeague("wta", "WTA Tour");

    // 2. Découverte des sport_keys actifs (tournois tennis en cours)
    let tennisKeys: string[] = [];
    try {
      tennisKeys = await fetchActiveSportKeys("Tennis");
      logger.info({ count: tennisKeys.length, keys: tennisKeys }, "ingest:tennis:discovered_keys");
    } catch (e) {
      logger.error({ err: String(e) }, "ingest:tennis:discover_error");
    }

    // 3. Pour chaque sport_key, fetch events → upsert players + fixtures + odds
    for (const sportKey of tennisKeys) {
      const isAtp = sportKey.includes("_atp_") || sportKey.includes("atp_");
      const leagueId = isAtp ? atpId : wtaId;
      try {
        const events = await fetchOddsForSportKey(sportKey, { regions: "eu,uk", markets: "h2h" });
        for (const ev of events) {
          const aId = await upsertPlayerAsTeam(leagueId, ev.home_team);
          const bId = await upsertPlayerAsTeam(leagueId, ev.away_team);
          const fxId = await upsertFixtureFromOdds(leagueId, aId, bId, ev, sportKey);
          fixturesUpserted++;
          oddsInserted += await insertH2hOdds(fxId, ev);
        }
        logger.info({ sportKey, events: events.length }, "ingest:tennis:tournament_done");
      } catch (e) {
        logger.error({ sportKey, err: String(e) }, "ingest:tennis:tournament_error");
      }
    }
    metrics.fixtures_upserted = fixturesUpserted;
    metrics.odds_inserted = oddsInserted;

    // 4. News
    for (const feed of NEWS_FEEDS) {
      try {
        const items = await fetchRss(feed.url, feed.source);
        newsInserted += await insertNewsItems(items);
        logger.info({ source: feed.source, items: items.length }, "ingest:tennis:news_done");
      } catch (e) {
        logger.error({ source: feed.source, err: String(e) }, "ingest:tennis:news_error");
      }
    }
    metrics.news_inserted = newsInserted;
    metrics.run_id = runId;
    logger.info({ runId, ...metrics }, "ingest:tennis:done");
  });
}

// ─── Upsert helpers ─────────────────────────────────────────────────────

async function upsertLeague(code: string, name: string): Promise<string> {
  const sb = getSupabase();
  const { data: existing } = await sb
    .from("leagues")
    .select("id")
    .eq("sport_id", "tennis")
    .eq("code", code)
    .maybeSingle();
  if (existing) return existing.id as string;
  const { data, error } = await sb
    .from("leagues")
    .insert({ sport_id: "tennis", code, name })
    .select("id")
    .single();
  if (error || !data) throw new Error(`upsertLeague(${code}) failed: ${error?.message}`);
  return data.id as string;
}

async function upsertPlayerAsTeam(leagueId: string, playerName: string): Promise<string> {
  const sb = getSupabase();
  const { data: existing } = await sb
    .from("teams")
    .select("id")
    .eq("sport_id", "tennis")
    .eq("league_id", leagueId)
    .eq("name", playerName)
    .maybeSingle();
  if (existing) return existing.id as string;
  const { data, error } = await sb
    .from("teams")
    .insert({ sport_id: "tennis", league_id: leagueId, name: playerName, ext_ids: { odds_api_name: playerName } })
    .select("id")
    .single();
  if (error || !data) throw new Error(`upsertPlayerAsTeam(${playerName}) failed: ${error?.message}`);
  return data.id as string;
}

async function upsertFixtureFromOdds(leagueId: string, aId: string, bId: string, ev: OddsApiEvent, sportKey: string): Promise<string> {
  const sb = getSupabase();
  const { data: existing } = await sb
    .from("fixtures")
    .select("id")
    .eq("sport_id", "tennis")
    .eq("ext_ids->>odds_api", ev.id)
    .maybeSingle();
  if (existing) {
    await sb.from("fixtures").update({ kickoff: ev.commence_time, updated_at: new Date().toISOString() }).eq("id", existing.id);
    return existing.id as string;
  }
  const { data, error } = await sb
    .from("fixtures")
    .insert({
      sport_id: "tennis",
      league_id: leagueId,
      home_team_id: aId,           // player_a
      away_team_id: bId,           // player_b
      kickoff: ev.commence_time,
      status: "scheduled",
      ext_ids: { odds_api: ev.id, tournament: sportKey },
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`upsertFixtureFromOdds(${ev.id}) failed: ${error?.message}`);
  return data.id as string;
}

async function insertH2hOdds(fixtureId: string, ev: OddsApiEvent): Promise<number> {
  const sb = getSupabase();
  const rows: Array<{ fixture_id: string; book: string; market: string; side: string; line: number | null; price: number }> = [];
  for (const bm of ev.bookmakers) {
    for (const m of bm.markets) {
      if (m.key !== "h2h") continue;
      for (const o of m.outcomes) {
        const side =
          o.name.toLowerCase() === ev.home_team.toLowerCase() ? "fighter_a" :
          o.name.toLowerCase() === ev.away_team.toLowerCase() ? "fighter_b" : null;
        if (!side) continue;
        rows.push({ fixture_id: fixtureId, book: `oddsapi:${bm.key}`, market: "ml", side, line: null, price: o.price });
      }
    }
  }
  if (rows.length === 0) return 0;
  const { error } = await sb.from("odds_snapshots").insert(rows);
  if (error) {
    logger.error({ err: error.message, fixtureId }, "ingest:tennis:odds_insert_error");
    return 0;
  }
  return rows.length;
}

async function insertNewsItems(items: RssItem[]): Promise<number> {
  if (items.length === 0) return 0;
  const sb = getSupabase();

  const texts = items.map((i) => `${i.title}\n\n${i.summary}`);
  let embeddings: number[][] = [];
  try {
    embeddings = await embedTexts(texts);
  } catch (e) {
    logger.warn({ err: String(e) }, "ingest:tennis:embed_failed_continue_without");
  }

  const rows = items.map((i, idx) => ({
    sport_id: "tennis",
    source: i.source,
    url: i.url,
    title: i.title.slice(0, 600),
    summary: i.summary,
    published_at: i.publishedAt?.toISOString() ?? null,
    embedding: embeddings[idx] ?? null,
  }));

  const { error, count } = await sb
    .from("news_items")
    .upsert(rows, { onConflict: "sport_id,source,url", ignoreDuplicates: true, count: "exact" });
  if (error) {
    logger.error({ err: error.message }, "ingest:tennis:news_upsert_error");
    return 0;
  }
  return count ?? rows.length;
}
