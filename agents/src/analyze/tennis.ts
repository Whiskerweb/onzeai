import { getSupabase } from "../shared/supabase.js";
import { logger } from "../shared/logger.js";
import { withRun } from "../shared/runs.js";
import { analyzeFixture } from "../shared/llm.js";
import { pushPick } from "../shared/push-pick.js";
import { getConfig } from "../shared/config.js";
import { sportToCoachId } from "../shared/types.js";
import { TENNIS_ANALYZE_ADDON } from "./tennis.addon.js";

export async function analyzeTennis(opts: { fixtureId?: string } = {}): Promise<void> {
  const cfg = getConfig();
  await withRun("tennis", "analyze", async (runId, metrics) => {
    const sb = getSupabase();

    let q = sb
      .from("fixtures")
      .select("id, kickoff, league_id, home_team_id, away_team_id, ext_ids")
      .eq("sport_id", "tennis")
      .eq("status", "scheduled")
      .gte("kickoff", new Date().toISOString())
      .lte("kickoff", new Date(Date.now() + 48 * 3600_000).toISOString())
      .order("kickoff", { ascending: true });

    if (opts.fixtureId) q = q.eq("id", opts.fixtureId);

    const { data: fixtures, error } = await q;
    if (error) throw new Error(`fetch fixtures: ${error.message}`);

    metrics.fixtures_candidates = fixtures?.length ?? 0;
    if (!fixtures || fixtures.length === 0) {
      logger.info("analyze:tennis:no_candidate_fixtures");
      return;
    }

    let analysed = 0, pushed = 0, passed = 0, watched = 0, pushFailed = 0;

    for (const fx of fixtures) {
      try {
        const context = await buildContext(fx.id);
        const { output, inputTokens, outputTokens, model } = await analyzeFixture({
          sportAddon: TENNIS_ANALYZE_ADDON,
          contextJson: context,
        });

        const { data: analysis, error: insErr } = await sb
          .from("analyses")
          .insert({
            sport_id: "tennis",
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
          logger.error({ fixtureId: fx.id, err: insErr.message }, "analyze:tennis:insert_analyses_error");
          continue;
        }

        analysed++;
        if (output.decision === "pass") passed++;
        if (output.decision === "watch") watched++;

        const shouldPush = output.decision === "push" && (output.edge_pct ?? 0) >= cfg.MIN_EDGE_PCT && output.recommended_price !== null;
        if (!shouldPush) continue;
        if (await dailyCapReached("tennis")) {
          logger.warn({ fixtureId: fx.id }, "analyze:tennis:daily_cap_reached_skip");
          continue;
        }

        const result = await pushPick({
          coach_id: sportToCoachId("tennis") as "tennis",
          pick_text: output.pick_text,
          cote: output.recommended_price,
          fixture_id: fx.id,
          reasoning: output.reasoning_short,
        });

        if (result.ok && result.pick) {
          await sb.from("analyses").update({ pick_id: result.pick.id }).eq("id", analysis.id);
          pushed++;
          logger.info({ fixtureId: fx.id, pickId: result.pick.id, edge: output.edge_pct }, "analyze:tennis:pushed");
        } else {
          pushFailed++;
          logger.error({ fixtureId: fx.id, err: result.error }, "analyze:tennis:push_error");
        }
      } catch (e) {
        logger.error({ fixtureId: fx.id, err: String(e) }, "analyze:tennis:fixture_error");
      }
    }

    metrics.analysed = analysed;
    metrics.pushed = pushed;
    metrics.passed = passed;
    metrics.watched = watched;
    metrics.push_failed = pushFailed;
    logger.info({ runId, ...metrics }, "analyze:tennis:done");
  });
}

async function buildContext(fixtureId: string): Promise<unknown> {
  const sb = getSupabase();
  const { data: fx } = await sb
    .from("fixtures")
    .select(
      "id, kickoff, status, ext_ids, league:leagues(code,name), home_team:teams!fixtures_home_team_id_fkey(id,name), away_team:teams!fixtures_away_team_id_fkey(id,name)",
    )
    .eq("id", fixtureId)
    .single();

  if (!fx) throw new Error(`fixture ${fixtureId} not found`);
  const fxAny = fx as unknown as {
    id: string;
    kickoff: string;
    status: string;
    ext_ids: { tournament?: string } | null;
    league: { code: string; name: string } | null;
    home_team: { id: string; name: string } | null;
    away_team: { id: string; name: string } | null;
  };

  const aId = fxAny.home_team?.id;
  const bId = fxAny.away_team?.id;
  const odds = await loadLatestOdds(fixtureId);
  const news = await loadRecentNews(aId ?? null, bId ?? null);

  return {
    fixture: {
      id: fxAny.id,
      kickoff: fxAny.kickoff,
      league: fxAny.league?.code ?? null,
      tour: fxAny.league?.name ?? null,
      tournament: fxAny.ext_ids?.tournament ?? null,
      player_a: fxAny.home_team?.name ?? null,
      player_b: fxAny.away_team?.name ?? null,
    },
    odds,
    news: news.map((n) => ({ title: n.title, summary: n.summary, source: n.source, published_at: n.published_at })),
    notes: "Phase 1 : pas d'ELO surface ni de stats serve en DB. Le LLM doit s'appuyer sur les odds, le tournoi (clay/hard/grass déductible du nom) et la news.",
  };
}

async function loadLatestOdds(fixtureId: string): Promise<Array<{ book: string; market: string; side: string; line: number | null; price: number; taken_at: string }>> {
  const sb = getSupabase();
  const { data } = await sb
    .from("odds_snapshots")
    .select("book, market, side, line, price, taken_at")
    .eq("fixture_id", fixtureId)
    .order("taken_at", { ascending: false })
    .limit(100);
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

async function loadRecentNews(aId: string | null, bId: string | null): Promise<Array<{ title: string; summary: string | null; source: string; published_at: string | null }>> {
  const sb = getSupabase();
  const cutoff = new Date(Date.now() - 7 * 86400_000).toISOString();
  const teamFilter: string[] = [];
  if (aId) teamFilter.push(aId);
  if (bId) teamFilter.push(bId);

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

  const { data } = await sb
    .from("news_items")
    .select("title, summary, source, published_at")
    .eq("sport_id", "tennis")
    .gte("created_at", cutoff)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(5);
  return (data ?? []) as Array<{ title: string; summary: string | null; source: string; published_at: string | null }>;
}

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
