import { getSupabase } from "../shared/supabase.js";
import { logger } from "../shared/logger.js";
import { embedTexts } from "../shared/embed.js";
import { withRun } from "../shared/runs.js";
import { fetchUpcomingGames, type BdlGame } from "../shared/sources/balldontlie.js";
import { fetchOddsForSportKey, ODDS_API_KEYS, type OddsApiEvent } from "../shared/sources/oddsapi.js";
import { fetchRss, type RssItem } from "../shared/sources/rss.js";

// Pipeline d'ingestion basket. NBA en priorité (couverture la plus dense côté
// data + odds) ; EuroLeague via the-odds-api uniquement (pas de fixture source
// gratuite équivalente à balldontlie pour l'EL — phase 2).

const NEWS_FEEDS = [
  { url: "https://www.espn.com/espn/rss/nba/news", source: "espn_nba" },
  { url: "https://feeds.bbci.co.uk/sport/basketball/rss.xml", source: "bbc_basketball" },
];

export async function ingestBasket(): Promise<void> {
  await withRun("basket", "ingest", async (runId, metrics) => {
    let fixturesUpserted = 0;
    let oddsInserted = 0;
    let newsInserted = 0;

    // 1. League NBA
    const nbaLeagueId = await upsertLeague("nba", "NBA", { balldontlie: "nba", odds_api: "basketball_nba" });
    const elLeagueId = await upsertLeague("euroleague", "EuroLeague", { odds_api: "basketball_euroleague" });

    // 2. Fixtures NBA via balldontlie (free)
    try {
      const games = await fetchUpcomingGames(7);
      for (const g of games) {
        // balldontlie renvoie aussi les jeux passés ; on ne garde que ceux à venir + non terminés
        if (g.status === "Final") continue;
        if (new Date(g.date).getTime() < Date.now() - 6 * 3600_000) continue;
        const homeId = await upsertTeam(nbaLeagueId, g.home_team.full_name, { balldontlie: g.home_team.id, abbreviation: g.home_team.abbreviation });
        const awayId = await upsertTeam(nbaLeagueId, g.visitor_team.full_name, { balldontlie: g.visitor_team.id, abbreviation: g.visitor_team.abbreviation });
        await upsertFixture(nbaLeagueId, homeId, awayId, g);
        fixturesUpserted++;
      }
      logger.info({ count: games.length }, "ingest:basket:nba_fixtures_done");
    } catch (e) {
      logger.error({ err: String(e) }, "ingest:basket:nba_fixtures_error");
    }
    metrics.fixtures_upserted = fixturesUpserted;

    // 3. Odds — NBA et EuroLeague. Pour EL on auto-crée les fixtures depuis les events odds-api.
    for (const sportKey of ODDS_API_KEYS.basket) {
      try {
        const events = await fetchOddsForSportKey(sportKey);
        const leagueId = sportKey === "basketball_euroleague" ? elLeagueId : nbaLeagueId;
        for (const ev of events) {
          let fxId = await findFixtureForOddsEvent(ev);
          if (!fxId) {
            // Pour EuroLeague, créer le fixture from-scratch à partir de l'event odds-api
            if (sportKey === "basketball_euroleague") {
              const homeId = await upsertTeam(elLeagueId, ev.home_team, { odds_api: ev.home_team });
              const awayId = await upsertTeam(elLeagueId, ev.away_team, { odds_api: ev.away_team });
              fxId = await upsertFixtureFromOdds(elLeagueId, homeId, awayId, ev);
              fixturesUpserted++;
            } else {
              continue;
            }
          }
          oddsInserted += await insertOddsForEvent(fxId, ev);
        }
        logger.info({ sportKey, events: events.length }, "ingest:basket:odds_done");
      } catch (e) {
        logger.error({ sportKey, err: String(e) }, "ingest:basket:odds_error");
      }
    }
    metrics.odds_inserted = oddsInserted;
    metrics.fixtures_upserted = fixturesUpserted;

    // 4. News
    for (const feed of NEWS_FEEDS) {
      try {
        const items = await fetchRss(feed.url, feed.source);
        newsInserted += await insertNewsItems(items);
        logger.info({ source: feed.source, items: items.length }, "ingest:basket:news_done");
      } catch (e) {
        logger.error({ source: feed.source, err: String(e) }, "ingest:basket:news_error");
      }
    }
    metrics.news_inserted = newsInserted;
    metrics.run_id = runId;
    logger.info({ runId, ...metrics }, "ingest:basket:done");
  });
}

// ─── Upsert helpers ─────────────────────────────────────────────────────

async function upsertLeague(code: string, name: string, ext: Record<string, string>): Promise<string> {
  const sb = getSupabase();
  const { data: existing } = await sb
    .from("leagues")
    .select("id, ext_ids")
    .eq("sport_id", "basket")
    .eq("code", code)
    .maybeSingle();
  if (existing) {
    const merged = { ...(existing.ext_ids ?? {}), ...ext };
    await sb.from("leagues").update({ ext_ids: merged }).eq("id", existing.id);
    return existing.id as string;
  }
  const { data, error } = await sb
    .from("leagues")
    .insert({ sport_id: "basket", code, name, ext_ids: ext })
    .select("id")
    .single();
  if (error || !data) throw new Error(`upsertLeague(${code}) failed: ${error?.message}`);
  return data.id as string;
}

async function upsertTeam(leagueId: string, name: string, ext: Record<string, string | number>): Promise<string> {
  const sb = getSupabase();
  const { data: existing } = await sb
    .from("teams")
    .select("id, ext_ids")
    .eq("sport_id", "basket")
    .eq("league_id", leagueId)
    .eq("name", name)
    .maybeSingle();
  if (existing) {
    const merged = { ...(existing.ext_ids ?? {}), ...ext };
    await sb.from("teams").update({ ext_ids: merged }).eq("id", existing.id);
    return existing.id as string;
  }
  const { data, error } = await sb
    .from("teams")
    .insert({ sport_id: "basket", league_id: leagueId, name, ext_ids: ext })
    .select("id")
    .single();
  if (error || !data) throw new Error(`upsertTeam(${name}) failed: ${error?.message}`);
  return data.id as string;
}

async function upsertFixture(leagueId: string, homeId: string, awayId: string, g: BdlGame): Promise<string> {
  const sb = getSupabase();
  const { data: existing } = await sb
    .from("fixtures")
    .select("id")
    .eq("sport_id", "basket")
    .eq("ext_ids->>balldontlie", String(g.id))
    .maybeSingle();
  const status = g.status === "Final" ? "finished" : "scheduled";
  if (existing) {
    await sb.from("fixtures").update({ kickoff: g.date, status, updated_at: new Date().toISOString() }).eq("id", existing.id);
    return existing.id as string;
  }
  const { data, error } = await sb
    .from("fixtures")
    .insert({
      sport_id: "basket",
      league_id: leagueId,
      home_team_id: homeId,
      away_team_id: awayId,
      kickoff: g.date,
      status,
      ext_ids: { balldontlie: g.id },
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`upsertFixture(bdl ${g.id}) failed: ${error?.message}`);
  return data.id as string;
}

async function upsertFixtureFromOdds(leagueId: string, homeId: string, awayId: string, ev: OddsApiEvent): Promise<string> {
  const sb = getSupabase();
  const { data: existing } = await sb
    .from("fixtures")
    .select("id")
    .eq("sport_id", "basket")
    .eq("ext_ids->>odds_api", ev.id)
    .maybeSingle();
  if (existing) {
    await sb.from("fixtures").update({ kickoff: ev.commence_time, updated_at: new Date().toISOString() }).eq("id", existing.id);
    return existing.id as string;
  }
  const { data, error } = await sb
    .from("fixtures")
    .insert({
      sport_id: "basket",
      league_id: leagueId,
      home_team_id: homeId,
      away_team_id: awayId,
      kickoff: ev.commence_time,
      status: "scheduled",
      ext_ids: { odds_api: ev.id },
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`upsertFixtureFromOdds(${ev.id}) failed: ${error?.message}`);
  return data.id as string;
}

// ─── Odds linkage ──────────────────────────────────────────────────────

async function findFixtureForOddsEvent(ev: OddsApiEvent): Promise<string | null> {
  const sb = getSupabase();
  const kickoff = new Date(ev.commence_time);
  const lo = new Date(kickoff.getTime() - 6 * 3600_000).toISOString();
  const hi = new Date(kickoff.getTime() + 6 * 3600_000).toISOString();

  const { data } = await sb
    .from("fixtures")
    .select("id, teams_home:teams!fixtures_home_team_id_fkey(name), teams_away:teams!fixtures_away_team_id_fkey(name)")
    .eq("sport_id", "basket")
    .gte("kickoff", lo)
    .lte("kickoff", hi);

  if (!data) return null;
  const home = ev.home_team.toLowerCase();
  const away = ev.away_team.toLowerCase();
  for (const f of data as Array<{ id: string; teams_home: { name: string }[] | { name: string } | null; teams_away: { name: string }[] | { name: string } | null }>) {
    const fhRaw = f.teams_home;
    const faRaw = f.teams_away;
    const fh = (Array.isArray(fhRaw) ? fhRaw[0]?.name : fhRaw?.name)?.toLowerCase() ?? "";
    const fa = (Array.isArray(faRaw) ? faRaw[0]?.name : faRaw?.name)?.toLowerCase() ?? "";
    if (fuzzyMatch(fh, home) && fuzzyMatch(fa, away)) return f.id;
  }
  return null;
}

function fuzzyMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  return a.includes(b) || b.includes(a);
}

async function insertOddsForEvent(fixtureId: string, ev: OddsApiEvent): Promise<number> {
  const sb = getSupabase();
  const rows: Array<{ fixture_id: string; book: string; market: string; side: string; line: number | null; price: number }> = [];

  for (const bm of ev.bookmakers) {
    for (const m of bm.markets) {
      const market = m.key === "h2h" ? "ml" : m.key === "spreads" ? "spread" : m.key === "totals" ? "total" : m.key;
      for (const o of m.outcomes) {
        const side = mapSide(market, o.name, ev.home_team, ev.away_team);
        if (!side) continue;
        rows.push({ fixture_id: fixtureId, book: `oddsapi:${bm.key}`, market, side, line: o.point ?? null, price: o.price });
      }
    }
  }
  if (rows.length === 0) return 0;
  const { error } = await sb.from("odds_snapshots").insert(rows);
  if (error) {
    logger.error({ err: error.message, fixtureId }, "ingest:basket:odds_insert_error");
    return 0;
  }
  return rows.length;
}

function mapSide(market: string, outcomeName: string, home: string, away: string): string | null {
  if (market === "ml" || market === "spread") {
    if (outcomeName.toLowerCase() === home.toLowerCase()) return "home";
    if (outcomeName.toLowerCase() === away.toLowerCase()) return "away";
    return null;
  }
  if (market === "total") {
    const n = outcomeName.toLowerCase();
    if (n === "over") return "over";
    if (n === "under") return "under";
    return null;
  }
  return null;
}

// ─── News ───────────────────────────────────────────────────────────────

async function insertNewsItems(items: RssItem[]): Promise<number> {
  if (items.length === 0) return 0;
  const sb = getSupabase();

  const texts = items.map((i) => `${i.title}\n\n${i.summary}`);
  let embeddings: number[][] = [];
  try {
    embeddings = await embedTexts(texts);
  } catch (e) {
    logger.warn({ err: String(e) }, "ingest:basket:embed_failed_continue_without");
  }

  const rows = items.map((i, idx) => ({
    sport_id: "basket",
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
    logger.error({ err: error.message }, "ingest:basket:news_upsert_error");
    return 0;
  }
  return count ?? rows.length;
}
