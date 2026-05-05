import { getSupabase } from "../shared/supabase.js";
import { logger } from "../shared/logger.js";
import { embedTexts } from "../shared/embed.js";
import { withRun } from "../shared/runs.js";
import { fetchScheduledMatches, FD_COMPETITIONS, type FdMatch } from "../shared/sources/footballdata.js";
import { fetchOddsForSportKey, ODDS_API_KEYS, type OddsApiEvent } from "../shared/sources/oddsapi.js";
import { fetchSeasonTeamStats, lastNxG, type UndTeam } from "../shared/sources/understat.js";
import { fetchRss, type RssItem } from "../shared/sources/rss.js";

// Pipeline d'ingestion foot.
//
// Couvre les top-5 ligues européennes + UCL/UEL.
// Sources : football-data.org (fixtures), the-odds-api (odds), Understat (xG), RSS (news).
//
// Stratégie d'upsert : on utilise (sport_id, league_id, name) comme clé naturelle
// pour les teams. Pour fixtures, ext_ids->>'footballdata' sert d'identifiant soft.

type LeagueSlug = keyof typeof FD_COMPETITIONS;

const LEAGUES: Array<{
  slug: LeagueSlug;
  name: string;
  understatSlug?: keyof typeof UND_LEAGUES;
}> = [
  { slug: "l1", name: "Ligue 1", understatSlug: "l1" },
  { slug: "pl", name: "Premier League", understatSlug: "pl" },
  { slug: "liga", name: "La Liga", understatSlug: "liga" },
  { slug: "serie_a", name: "Serie A", understatSlug: "serie_a" },
  { slug: "bundesliga", name: "Bundesliga", understatSlug: "bundesliga" },
  { slug: "champions_league", name: "Champions League" },
  { slug: "europa_league", name: "Europa League" },
];

const UND_LEAGUES = {
  l1: "l1",
  pl: "pl",
  liga: "liga",
  serie_a: "serie_a",
  bundesliga: "bundesliga",
} as const;

const NEWS_FEEDS = [
  { url: "https://www.lequipe.fr/rss/actu_rss_Football.xml", source: "lequipe", league: null },
  { url: "https://feeds.bbci.co.uk/sport/football/rss.xml", source: "bbc", league: null },
];

export async function ingestFoot(): Promise<void> {
  await withRun("foot", "ingest", async (runId, metrics) => {
    const sb = getSupabase();
    let leaguesProcessed = 0;
    let fixturesUpserted = 0;
    let oddsInserted = 0;
    let statsInserted = 0;
    let newsInserted = 0;

    // 1. Upsert leagues
    const leagueIdsBySlug = new Map<string, string>();
    for (const league of LEAGUES) {
      const fdCode = FD_COMPETITIONS[league.slug];
      const id = await upsertLeague(league.slug, league.name, { footballdata: fdCode });
      leagueIdsBySlug.set(league.slug, id);
    }
    metrics.leagues = LEAGUES.length;

    // 2. Fixtures par ligue (football-data.org)
    const fixtureIdByFdId = new Map<number, string>();
    for (const league of LEAGUES) {
      try {
        const matches = await fetchScheduledMatches(FD_COMPETITIONS[league.slug]);
        const leagueId = leagueIdsBySlug.get(league.slug)!;
        for (const m of matches) {
          const homeId = await upsertTeam(leagueId, m.homeTeam.name, { footballdata: m.homeTeam.id });
          const awayId = await upsertTeam(leagueId, m.awayTeam.name, { footballdata: m.awayTeam.id });
          const fxId = await upsertFixture(leagueId, homeId, awayId, m);
          fixtureIdByFdId.set(m.id, fxId);
          fixturesUpserted++;
        }
        leaguesProcessed++;
        logger.info({ league: league.slug, matches: matches.length }, "ingest:foot:league_fixtures_done");
      } catch (e) {
        logger.error({ league: league.slug, err: String(e) }, "ingest:foot:league_fixtures_error");
      }
    }
    metrics.fixtures_upserted = fixturesUpserted;

    // 3. Odds (the-odds-api) — un appel par sport_key, on relie aux fixtures par teams + kickoff
    for (const sportKey of ODDS_API_KEYS.foot) {
      try {
        const events = await fetchOddsForSportKey(sportKey);
        for (const ev of events) {
          // Match par noms d'équipes (fuzzy) sur la fenêtre ±6h autour du commence_time
          const fxId = await findFixtureForOddsEvent(ev);
          if (!fxId) continue;
          const inserted = await insertOddsForEvent(fxId, ev);
          oddsInserted += inserted;
        }
        logger.info({ sportKey, events: events.length }, "ingest:foot:odds_done");
      } catch (e) {
        logger.error({ sportKey, err: String(e) }, "ingest:foot:odds_error");
      }
    }
    metrics.odds_inserted = oddsInserted;

    // 4. Stats xG (Understat) par équipe — last5
    const year = currentSeasonYear();
    for (const league of LEAGUES) {
      if (!league.understatSlug) continue;
      try {
        const teams = await fetchSeasonTeamStats(UND_LEAGUES[league.understatSlug], year);
        const inserted = await insertTeamStats(leagueIdsBySlug.get(league.slug)!, teams);
        statsInserted += inserted;
        logger.info({ league: league.slug, teams: teams.length }, "ingest:foot:stats_done");
      } catch (e) {
        logger.error({ league: league.slug, err: String(e) }, "ingest:foot:stats_error");
      }
    }
    metrics.stats_inserted = statsInserted;

    // 5. News (RSS feeds) + embeddings
    for (const feed of NEWS_FEEDS) {
      try {
        const items = await fetchRss(feed.url, feed.source);
        const inserted = await insertNewsItems("foot", null, items);
        newsInserted += inserted;
        logger.info({ source: feed.source, items: items.length }, "ingest:foot:news_done");
      } catch (e) {
        logger.error({ source: feed.source, err: String(e) }, "ingest:foot:news_error");
      }
    }
    metrics.news_inserted = newsInserted;

    metrics.run_id = runId;
    logger.info({ runId, ...metrics }, "ingest:foot:done");
  });
}

// ─── Upsert helpers ─────────────────────────────────────────────────────

async function upsertLeague(code: string, name: string, ext: Record<string, string>): Promise<string> {
  const sb = getSupabase();
  // Lookup
  const { data: existing } = await sb
    .from("leagues")
    .select("id, ext_ids")
    .eq("sport_id", "foot")
    .eq("code", code)
    .maybeSingle();
  if (existing) {
    const merged = { ...(existing.ext_ids ?? {}), ...ext };
    await sb.from("leagues").update({ ext_ids: merged }).eq("id", existing.id);
    return existing.id as string;
  }
  const { data, error } = await sb
    .from("leagues")
    .insert({ sport_id: "foot", code, name, ext_ids: ext })
    .select("id")
    .single();
  if (error || !data) throw new Error(`upsertLeague(${code}) failed: ${error?.message}`);
  return data.id as string;
}

async function upsertTeam(leagueId: string, name: string, ext: Record<string, string | number>): Promise<string> {
  const sb = getSupabase();
  // Lookup par nom dans la ligue (pattern simple ; les fuzzy renames se gèrent à la main au pivot saison)
  const { data: existing } = await sb
    .from("teams")
    .select("id, ext_ids")
    .eq("sport_id", "foot")
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
    .insert({ sport_id: "foot", league_id: leagueId, name, ext_ids: ext })
    .select("id")
    .single();
  if (error || !data) throw new Error(`upsertTeam(${name}) failed: ${error?.message}`);
  return data.id as string;
}

async function upsertFixture(leagueId: string, homeId: string, awayId: string, m: FdMatch): Promise<string> {
  const sb = getSupabase();
  // Lookup par ext_ids->>footballdata
  const { data: existing } = await sb
    .from("fixtures")
    .select("id")
    .eq("sport_id", "foot")
    .eq("ext_ids->>footballdata", String(m.id))
    .maybeSingle();
  if (existing) {
    await sb
      .from("fixtures")
      .update({
        kickoff: m.utcDate,
        status: m.status.toLowerCase(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    return existing.id as string;
  }
  const { data, error } = await sb
    .from("fixtures")
    .insert({
      sport_id: "foot",
      league_id: leagueId,
      home_team_id: homeId,
      away_team_id: awayId,
      kickoff: m.utcDate,
      status: m.status.toLowerCase(),
      ext_ids: { footballdata: m.id },
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`upsertFixture(${m.id}) failed: ${error?.message}`);
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
    .select("id, home_team_id, away_team_id, teams_home:teams!fixtures_home_team_id_fkey(name), teams_away:teams!fixtures_away_team_id_fkey(name)")
    .eq("sport_id", "foot")
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
  // tolérance large : un nom contient l'autre
  return a.includes(b) || b.includes(a);
}

async function insertOddsForEvent(fixtureId: string, ev: OddsApiEvent): Promise<number> {
  const sb = getSupabase();
  const rows: Array<{
    fixture_id: string;
    book: string;
    market: string;
    side: string;
    line: number | null;
    price: number;
  }> = [];

  for (const bm of ev.bookmakers) {
    for (const m of bm.markets) {
      const market = m.key === "h2h" ? "1x2" : m.key === "spreads" ? "ah" : m.key === "totals" ? "ou" : m.key;
      for (const o of m.outcomes) {
        const side = mapSide(market, o.name, ev.home_team, ev.away_team);
        if (!side) continue;
        rows.push({
          fixture_id: fixtureId,
          book: `oddsapi:${bm.key}`,
          market,
          side,
          line: o.point ?? null,
          price: o.price,
        });
      }
    }
  }

  if (rows.length === 0) return 0;
  const { error } = await sb.from("odds_snapshots").insert(rows);
  if (error) {
    logger.error({ err: error.message, fixtureId }, "ingest:foot:odds_insert_error");
    return 0;
  }
  return rows.length;
}

function mapSide(market: string, outcomeName: string, home: string, away: string): string | null {
  if (market === "1x2") {
    if (outcomeName.toLowerCase() === home.toLowerCase()) return "home";
    if (outcomeName.toLowerCase() === away.toLowerCase()) return "away";
    if (outcomeName.toLowerCase() === "draw") return "draw";
    return null;
  }
  if (market === "ah") {
    if (outcomeName.toLowerCase() === home.toLowerCase()) return "home";
    if (outcomeName.toLowerCase() === away.toLowerCase()) return "away";
    return null;
  }
  if (market === "ou") {
    const n = outcomeName.toLowerCase();
    if (n === "over") return "over";
    if (n === "under") return "under";
    return null;
  }
  return null;
}

// ─── Stats team (Understat) ────────────────────────────────────────────

async function insertTeamStats(leagueId: string, teams: UndTeam[]): Promise<number> {
  const sb = getSupabase();
  const rows: Array<{
    team_id: string;
    period: string;
    metric: string;
    value: number;
  }> = [];

  for (const t of teams) {
    // Résoudre le team_id via le nom (Understat utilise des libellés courts cf. "Paris SG")
    const teamId = await findTeamIdByLikelyName(leagueId, t.title);
    if (!teamId) continue;

    const last5 = lastNxG(t, 5);
    if (last5.matches > 0) {
      rows.push({ team_id: teamId, period: "last5", metric: "xg", value: last5.xG });
      rows.push({ team_id: teamId, period: "last5", metric: "xga", value: last5.xGA });
    }
    const seasonXG = t.history.reduce((a, h) => a + parseFloat(h.xG), 0);
    const seasonXGA = t.history.reduce((a, h) => a + parseFloat(h.xGA), 0);
    rows.push({ team_id: teamId, period: "season", metric: "xg", value: seasonXG });
    rows.push({ team_id: teamId, period: "season", metric: "xga", value: seasonXGA });
  }

  if (rows.length === 0) return 0;
  const { error } = await sb.from("stats_team").insert(rows);
  if (error) {
    logger.error({ err: error.message }, "ingest:foot:stats_insert_error");
    return 0;
  }
  return rows.length;
}

async function findTeamIdByLikelyName(leagueId: string, undTitle: string): Promise<string | null> {
  const sb = getSupabase();
  // 1) match exact
  const { data: exact } = await sb
    .from("teams")
    .select("id")
    .eq("league_id", leagueId)
    .eq("name", undTitle)
    .maybeSingle();
  if (exact) return exact.id as string;

  // 2) match approchant (ilike)
  const pattern = `%${undTitle.replace(/[^A-Za-z]/g, "")}%`;
  const { data: like } = await sb
    .from("teams")
    .select("id, name")
    .eq("league_id", leagueId)
    .ilike("name", pattern);
  if (like && like.length === 1) return like[0]!.id as string;

  return null;
}

// ─── News ───────────────────────────────────────────────────────────────

async function insertNewsItems(sportId: "foot", leagueId: string | null, items: RssItem[]): Promise<number> {
  if (items.length === 0) return 0;
  const sb = getSupabase();

  const texts = items.map((i) => `${i.title}\n\n${i.summary}`);
  let embeddings: number[][] = [];
  try {
    embeddings = await embedTexts(texts);
  } catch (e) {
    logger.warn({ err: String(e) }, "ingest:foot:embed_failed_continue_without");
  }

  const rows = items.map((i, idx) => ({
    sport_id: sportId,
    league_id: leagueId,
    source: i.source,
    url: i.url,
    title: i.title.slice(0, 600),
    summary: i.summary,
    published_at: i.publishedAt?.toISOString() ?? null,
    embedding: embeddings[idx] ?? null,
  }));

  // Idempotence : la table a un unique (sport_id, source, url). On utilise upsert.
  const { error, count } = await sb
    .from("news_items")
    .upsert(rows, { onConflict: "sport_id,source,url", ignoreDuplicates: true, count: "exact" });
  if (error) {
    logger.error({ err: error.message }, "ingest:foot:news_upsert_error");
    return 0;
  }
  return count ?? rows.length;
}

// ─── Helpers ───────────────────────────────────────────────────────────

function currentSeasonYear(): number {
  // La saison "2025/26" est représentée par 2025 sur Understat.
  const now = new Date();
  // Mois 0-indexed : juillet = 6. Avant juillet on est encore sur la saison précédente.
  return now.getMonth() < 6 ? now.getFullYear() - 1 : now.getFullYear();
}
