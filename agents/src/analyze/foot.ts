import { getSupabase } from "../shared/supabase.js";
import { logger } from "../shared/logger.js";
import { withRun } from "../shared/runs.js";
import { analyzeFixture } from "../shared/llm.js";
import { pushPick } from "../shared/push-pick.js";
import { getConfig } from "../shared/config.js";
import { sportToCoachId } from "../shared/types.js";
import { FOOT_ANALYZE_ADDON } from "./foot.addon.js";

// Pipeline d'analyse foot.
// Pour chaque fixture next 48h non-déjà-analysé :
//   1. Build context bundle (stats, odds, news, injuries)
//   2. Call Claude avec sports-bettor-pro.md + FOOT_ANALYZE_ADDON
//   3. Insert public.analyses
//   4. If decision='push' && edge >= MIN_EDGE_PCT && cap journalier non atteint → pushPick

export async function analyzeFoot(opts: { fixtureId?: string } = {}): Promise<void> {
  const cfg = getConfig();
  await withRun("foot", "analyze", async (runId, metrics) => {
    const sb = getSupabase();

    // 1. Fixtures à analyser
    let q = sb
      .from("fixtures")
      .select("id, kickoff, league_id, home_team_id, away_team_id")
      .eq("sport_id", "foot")
      .eq("status", "scheduled")
      .gte("kickoff", new Date().toISOString())
      .lte("kickoff", new Date(Date.now() + 48 * 3600_000).toISOString())
      .order("kickoff", { ascending: true });

    if (opts.fixtureId) q = q.eq("id", opts.fixtureId);

    const { data: fixtures, error } = await q;
    if (error) throw new Error(`fetch fixtures: ${error.message}`);

    metrics.fixtures_candidates = fixtures?.length ?? 0;
    if (!fixtures || fixtures.length === 0) {
      logger.info("analyze:foot:no_candidate_fixtures");
      return;
    }

    let analysed = 0;
    let pushed = 0;
    let passed = 0;
    let watched = 0;
    let pushFailed = 0;

    for (const fx of fixtures) {
      try {
        const context = await buildContext(fx.id);
        const { output, inputTokens, outputTokens, model } = await analyzeFixture({
          sportAddon: FOOT_ANALYZE_ADDON,
          contextJson: context,
        });

        // Insert analyses row systématiquement (audit complet)
        const { data: analysis, error: insErr } = await sb
          .from("analyses")
          .insert({
            sport_id: "foot",
            fixture_id: fx.id,
            agent_run_id: runId,
            model,
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            market: output.market,
            side: output.side,
            line: output.line,
            recommended_price: output.recommended_price,
            p_model: output.p_model,
            p_fair: output.p_fair,
            edge_pct: output.edge_pct,
            expected_clv_pp: output.expected_clv_pp,
            decision: output.decision,
            reasoning: output.reasoning_long,
          })
          .select("id")
          .single();
        if (insErr) {
          logger.error({ fixtureId: fx.id, err: insErr.message }, "analyze:foot:insert_analyses_error");
          continue;
        }

        analysed++;
        if (output.decision === "pass") passed++;
        if (output.decision === "watch") watched++;

        // Push gating
        const shouldPush =
          output.decision === "push" &&
          (output.edge_pct ?? 0) >= cfg.MIN_EDGE_PCT &&
          output.recommended_price !== null;

        if (!shouldPush) continue;

        // Cap journalier par coach
        if (await dailyCapReached("foot")) {
          logger.warn({ fixtureId: fx.id }, "analyze:foot:daily_cap_reached_skip");
          continue;
        }

        const result = await pushPick({
          coach_id: sportToCoachId("foot") as "foot",
          pick_text: output.pick_text,
          cote: output.recommended_price,
          fixture_id: fx.id,
          reasoning: output.reasoning_short,
        });

        if (result.ok && result.pick) {
          // back-ref pick_id dans analyses
          await sb.from("analyses").update({ pick_id: result.pick.id }).eq("id", analysis.id);
          pushed++;
          logger.info({ fixtureId: fx.id, pickId: result.pick.id, edge: output.edge_pct }, "analyze:foot:pushed");
        } else {
          pushFailed++;
          logger.error({ fixtureId: fx.id, err: result.error }, "analyze:foot:push_error");
        }
      } catch (e) {
        logger.error({ fixtureId: fx.id, err: String(e) }, "analyze:foot:fixture_error");
      }
    }

    metrics.analysed = analysed;
    metrics.pushed = pushed;
    metrics.passed = passed;
    metrics.watched = watched;
    metrics.push_failed = pushFailed;
    logger.info({ runId, ...metrics }, "analyze:foot:done");
  });
}

// ─── Context bundle ────────────────────────────────────────────────────

async function buildContext(fixtureId: string): Promise<unknown> {
  const sb = getSupabase();

  // Fixture + équipes + ligue
  const { data: fx } = await sb
    .from("fixtures")
    .select(
      "id, kickoff, status, league:leagues(id,code,name), home_team:teams!fixtures_home_team_id_fkey(id,name), away_team:teams!fixtures_away_team_id_fkey(id,name)",
    )
    .eq("id", fixtureId)
    .single();

  if (!fx) throw new Error(`fixture ${fixtureId} not found`);

  const fxAny = fx as unknown as {
    id: string;
    kickoff: string;
    status: string;
    league: { id: string; code: string; name: string } | null;
    home_team: { id: string; name: string } | null;
    away_team: { id: string; name: string } | null;
  };

  const homeId = fxAny.home_team?.id;
  const awayId = fxAny.away_team?.id;

  // Stats équipes (last5 + season, derniers points en date)
  const stats = await loadLatestStats([homeId, awayId].filter(Boolean) as string[]);

  // Odds — derniers snapshots par (book, market, side, line)
  const odds = await loadLatestOdds(fixtureId);

  // News — last 5 articles touchant l'une des équipes (par team_id) ou rss league
  const news = await loadRecentNews(homeId ?? null, awayId ?? null, fxAny.league?.id ?? null);

  // Injuries
  const injuries = await loadActiveInjuries([homeId, awayId].filter(Boolean) as string[]);

  return {
    fixture: {
      id: fxAny.id,
      kickoff: fxAny.kickoff,
      league: fxAny.league ? { code: fxAny.league.code, name: fxAny.league.name } : null,
      home: fxAny.home_team?.name ?? null,
      away: fxAny.away_team?.name ?? null,
    },
    stats,
    odds,
    news: news.map((n) => ({
      title: n.title,
      summary: n.summary,
      source: n.source,
      published_at: n.published_at,
    })),
    injuries,
  };
}

async function loadLatestStats(teamIds: string[]): Promise<Record<string, Record<string, number>>> {
  if (teamIds.length === 0) return {};
  const sb = getSupabase();
  const { data } = await sb
    .from("stats_team")
    .select("team_id, period, metric, value, computed_at")
    .in("team_id", teamIds)
    .order("computed_at", { ascending: false })
    .limit(200);
  const out: Record<string, Record<string, number>> = {};
  for (const r of (data ?? []) as Array<{ team_id: string; period: string; metric: string; value: number }>) {
    const key = `${r.period}.${r.metric}`;
    out[r.team_id] ??= {};
    if (!(key in out[r.team_id]!)) out[r.team_id]![key] = r.value;
  }
  return out;
}

async function loadLatestOdds(fixtureId: string): Promise<Array<{ book: string; market: string; side: string; line: number | null; price: number; taken_at: string }>> {
  const sb = getSupabase();
  const { data } = await sb
    .from("odds_snapshots")
    .select("book, market, side, line, price, taken_at")
    .eq("fixture_id", fixtureId)
    .order("taken_at", { ascending: false })
    .limit(200);
  // Dédupe sur (book, market, side, line) en gardant le plus récent
  const seen = new Set<string>();
  const result: Array<{ book: string; market: string; side: string; line: number | null; price: number; taken_at: string }> = [];
  for (const r of (data ?? []) as Array<{ book: string; market: string; side: string; line: number | null; price: number; taken_at: string }>) {
    const k = `${r.book}|${r.market}|${r.side}|${r.line ?? ""}`;
    if (seen.has(k)) continue;
    seen.add(k);
    result.push(r);
  }
  return result;
}

async function loadRecentNews(homeId: string | null, awayId: string | null, leagueId: string | null): Promise<Array<{ title: string; summary: string | null; source: string; published_at: string | null }>> {
  const sb = getSupabase();
  const cutoff = new Date(Date.now() - 7 * 86400_000).toISOString();
  // Priorité aux news qui matchent une des équipes ; fallback news ligue
  const teamFilter: string[] = [];
  if (homeId) teamFilter.push(homeId);
  if (awayId) teamFilter.push(awayId);

  if (teamFilter.length > 0) {
    const { data } = await sb
      .from("news_items")
      .select("title, summary, source, published_at")
      .in("team_id", teamFilter)
      .gte("created_at", cutoff)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(5);
    if (data && data.length > 0) return data as Array<{ title: string; summary: string | null; source: string; published_at: string | null }>;
  }

  // Fallback : news foot récentes (pas team-tagged)
  const { data } = await sb
    .from("news_items")
    .select("title, summary, source, published_at")
    .eq("sport_id", "foot")
    .gte("created_at", cutoff)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(5);
  return (data ?? []) as Array<{ title: string; summary: string | null; source: string; published_at: string | null }>;
}

async function loadActiveInjuries(teamIds: string[]): Promise<Array<{ player_name: string | null; status: string; details: string | null; reported_at: string }>> {
  if (teamIds.length === 0) return [];
  const sb = getSupabase();
  const { data } = await sb
    .from("injuries")
    .select("status, details, reported_at, player:players(name)")
    .in("team_id", teamIds)
    .order("reported_at", { ascending: false })
    .limit(20);
  return ((data ?? []) as Array<{ status: string; details: string | null; reported_at: string; player: { name: string }[] | { name: string } | null }>).map((r) => ({
    player_name: Array.isArray(r.player) ? r.player[0]?.name ?? null : r.player?.name ?? null,
    status: r.status,
    details: r.details,
    reported_at: r.reported_at,
  }));
}

// ─── Cap journalier ───────────────────────────────────────────────────

async function dailyCapReached(coachId: string): Promise<boolean> {
  const cfg = getConfig();
  const sb = getSupabase();
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const { count } = await sb
    .from("picks")
    .select("id", { count: "exact", head: true })
    .eq("coach_id", coachId)
    .gte("created_at", since.toISOString());
  return (count ?? 0) >= cfg.PUSH_DAILY_CAP_PER_COACH;
}
