import { getSupabase } from "../shared/supabase.js";
import { logger } from "../shared/logger.js";
import { embedTexts } from "../shared/embed.js";
import { withRun } from "../shared/runs.js";
import { fetchOddsForSportKey, ODDS_API_KEYS, type OddsApiEvent } from "../shared/sources/oddsapi.js";
import { fetchRss, type RssItem } from "../shared/sources/rss.js";

// Pipeline d'ingestion UFC. Phase 1 : the-odds-api uniquement (1 sport_key,
// 'mma_mixed_martial_arts'). Chaque fight = un fixture, fighters stockés comme
// teams. ufcstats.com et Sherdog scrapes en phase 2.

const NEWS_FEEDS = [
  { url: "https://www.mmajunkie.usatoday.com/feed", source: "mma_junkie" },
  { url: "https://www.bloodyelbow.com/rss/index.xml", source: "bloody_elbow" },
];

export async function ingestUfc(): Promise<void> {
  await withRun("ufc", "ingest", async (runId, metrics) => {
    let fixturesUpserted = 0;
    let oddsInserted = 0;
    let newsInserted = 0;

    const ufcLeagueId = await upsertLeague("ufc", "UFC");

    for (const sportKey of ODDS_API_KEYS.ufc) {
      try {
        const events = await fetchOddsForSportKey(sportKey, { regions: "eu,uk", markets: "h2h" });
        for (const ev of events) {
          const aId = await upsertFighterAsTeam(ufcLeagueId, ev.home_team);
          const bId = await upsertFighterAsTeam(ufcLeagueId, ev.away_team);
          const fxId = await upsertFixtureFromOdds(ufcLeagueId, aId, bId, ev);
          fixturesUpserted++;
          oddsInserted += await insertH2hOdds(fxId, ev);
        }
        logger.info({ sportKey, events: events.length }, "ingest:ufc:odds_done");
      } catch (e) {
        logger.error({ sportKey, err: String(e) }, "ingest:ufc:odds_error");
      }
    }
    metrics.fixtures_upserted = fixturesUpserted;
    metrics.odds_inserted = oddsInserted;

    for (const feed of NEWS_FEEDS) {
      try {
        const items = await fetchRss(feed.url, feed.source);
        newsInserted += await insertNewsItems(items);
        logger.info({ source: feed.source, items: items.length }, "ingest:ufc:news_done");
      } catch (e) {
        logger.error({ source: feed.source, err: String(e) }, "ingest:ufc:news_error");
      }
    }
    metrics.news_inserted = newsInserted;
    metrics.run_id = runId;
    logger.info({ runId, ...metrics }, "ingest:ufc:done");
  });
}

async function upsertLeague(code: string, name: string): Promise<string> {
  const sb = getSupabase();
  const { data: existing } = await sb
    .from("leagues")
    .select("id")
    .eq("sport_id", "ufc")
    .eq("code", code)
    .maybeSingle();
  if (existing) return existing.id as string;
  const { data, error } = await sb
    .from("leagues")
    .insert({ sport_id: "ufc", code, name })
    .select("id")
    .single();
  if (error || !data) throw new Error(`upsertLeague(${code}) failed: ${error?.message}`);
  return data.id as string;
}

async function upsertFighterAsTeam(leagueId: string, fighterName: string): Promise<string> {
  const sb = getSupabase();
  const { data: existing } = await sb
    .from("teams")
    .select("id")
    .eq("sport_id", "ufc")
    .eq("league_id", leagueId)
    .eq("name", fighterName)
    .maybeSingle();
  if (existing) return existing.id as string;
  const { data, error } = await sb
    .from("teams")
    .insert({ sport_id: "ufc", league_id: leagueId, name: fighterName, ext_ids: { odds_api_name: fighterName } })
    .select("id")
    .single();
  if (error || !data) throw new Error(`upsertFighterAsTeam(${fighterName}) failed: ${error?.message}`);
  return data.id as string;
}

async function upsertFixtureFromOdds(leagueId: string, aId: string, bId: string, ev: OddsApiEvent): Promise<string> {
  const sb = getSupabase();
  const { data: existing } = await sb
    .from("fixtures")
    .select("id")
    .eq("sport_id", "ufc")
    .eq("ext_ids->>odds_api", ev.id)
    .maybeSingle();
  if (existing) {
    await sb.from("fixtures").update({ kickoff: ev.commence_time, updated_at: new Date().toISOString() }).eq("id", existing.id);
    return existing.id as string;
  }
  const { data, error } = await sb
    .from("fixtures")
    .insert({
      sport_id: "ufc",
      league_id: leagueId,
      home_team_id: aId,
      away_team_id: bId,
      kickoff: ev.commence_time,
      status: "scheduled",
      ext_ids: { odds_api: ev.id, sport_title: ev.sport_title },
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
    logger.error({ err: error.message, fixtureId }, "ingest:ufc:odds_insert_error");
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
    logger.warn({ err: String(e) }, "ingest:ufc:embed_failed_continue_without");
  }

  const rows = items.map((i, idx) => ({
    sport_id: "ufc",
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
    logger.error({ err: error.message }, "ingest:ufc:news_upsert_error");
    return 0;
  }
  return count ?? rows.length;
}
