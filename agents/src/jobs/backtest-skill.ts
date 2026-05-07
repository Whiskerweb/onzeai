import { randomUUID } from "node:crypto";
import { assertSport, type SportId } from "../shared/config.js";
import { getSupabase } from "../shared/supabase.js";
import { logger } from "../shared/logger.js";
import { withRun } from "../shared/runs.js";
import { analyzeFixture } from "../shared/llm.js";
import { FOOT_ANALYZE_ADDON } from "../analyze/foot.addon.js";
import { BASKET_ANALYZE_ADDON } from "../analyze/basket.addon.js";
import { TENNIS_ANALYZE_ADDON } from "../analyze/tennis.addon.js";
import { UFC_ANALYZE_ADDON } from "../analyze/ufc.addon.js";

// Backtest A/B variant runner pour valider l'effet ROI/CLV d'un skill coach
// avant rollout prod. Rejoue les N dernières fixtures terminées d'un sport en
// 2 variants parallèles :
//   - variant A : sans skill coach (override : on contourne loadCoachSkill)
//   - variant B : avec skill coach (cascade actuelle)
//
// Pour chaque (fixture × variant) : on call analyzeFixture, on devine le
// closing_price via odds_snapshots (dernier snap pre-kickoff sur Pinnacle ou
// oddsapi_avg), on calcule simulated_clv_pp = (1/recommended − 1/closing) × 100,
// puis INSERT public.backtest_runs.
//
// Critère go : avg(clv_sim) variant B − variant A ≥ +0.5pp à N=30.
//
// Usage :
//   tsx --env-file=.env src/jobs/backtest-skill.ts --sport foot --n 30

const ADDONS: Record<SportId, string> = {
  foot: FOOT_ANALYZE_ADDON,
  basket: BASKET_ANALYZE_ADDON,
  tennis: TENNIS_ANALYZE_ADDON,
  ufc: UFC_ANALYZE_ADDON,
};

function arg(name: string): string | null {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return null;
  const v = process.argv[i + 1];
  return v && !v.startsWith("--") ? v : null;
}

type Variant = "A" | "B";

async function loadFixturesForBacktest(sport: SportId, n: number): Promise<Array<{ id: string }>> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("fixtures")
    .select("id, kickoff")
    .eq("sport_id", sport)
    .eq("status", "finished")
    .order("kickoff", { ascending: false })
    .limit(n);
  if (error) throw new Error(`load fixtures: ${error.message}`);
  return data ?? [];
}

async function buildContext(fixtureId: string): Promise<unknown> {
  const sb = getSupabase();
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
    league: { code: string; name: string } | null;
    home_team: { id: string; name: string } | null;
    away_team: { id: string; name: string } | null;
  };
  const homeId = fxAny.home_team?.id;
  const awayId = fxAny.away_team?.id;

  const { data: stats } = await sb
    .from("stats_team")
    .select("team_id, period, metric, value")
    .in("team_id", [homeId, awayId].filter(Boolean) as string[])
    .order("computed_at", { ascending: false })
    .limit(200);

  // Odds *avant kickoff* — pas d'odds live ou post-match
  const { data: oddsRaw } = await sb
    .from("odds_snapshots")
    .select("book, market, side, line, price, taken_at")
    .eq("fixture_id", fixtureId)
    .lte("taken_at", fxAny.kickoff)
    .order("taken_at", { ascending: false })
    .limit(200);
  const seen = new Set<string>();
  const odds: typeof oddsRaw = [];
  for (const r of oddsRaw ?? []) {
    const k = `${r.book}|${r.market}|${r.side}|${r.line ?? ""}`;
    if (seen.has(k)) continue;
    seen.add(k);
    odds.push(r);
  }

  return {
    fixture: {
      id: fxAny.id,
      kickoff: fxAny.kickoff,
      league: fxAny.league ? { code: fxAny.league.code, name: fxAny.league.name } : null,
      home: fxAny.home_team?.name ?? null,
      away: fxAny.away_team?.name ?? null,
    },
    stats: stats ?? [],
    odds: odds ?? [],
    news: [],         // hors scope backtest (news historisées peu fiables)
    injuries: [],
  };
}

async function findClosingPrice(
  fixtureId: string,
  market: string | null,
  side: string | null,
  line: number | null,
): Promise<{ closing_price: number | null; closing_book: string | null }> {
  if (!market || !side) return { closing_price: null, closing_book: null };
  const sb = getSupabase();
  // Dernier snap pre-kickoff sur Pinnacle préférentiellement, sinon oddsapi_avg
  const { data: fx } = await sb.from("fixtures").select("kickoff").eq("id", fixtureId).single();
  if (!fx) return { closing_price: null, closing_book: null };

  for (const book of ["pinnacle", "oddsapi_avg"]) {
    const q = sb
      .from("odds_snapshots")
      .select("price, book, taken_at")
      .eq("fixture_id", fixtureId)
      .eq("book", book)
      .eq("market", market)
      .eq("side", side)
      .lte("taken_at", fx.kickoff)
      .order("taken_at", { ascending: false })
      .limit(1);
    const { data } = line === null ? await q.is("line", null) : await q.eq("line", line);
    const row = data?.[0];
    if (row) return { closing_price: row.price, closing_book: row.book };
  }
  return { closing_price: null, closing_book: null };
}

function clvPp(taken: number | null, closing: number | null): number | null {
  if (!taken || !closing) return null;
  return Number(((1 / taken - 1 / closing) * 100).toFixed(3));
}

async function runVariant(
  runId: string,
  sport: SportId,
  fixtureId: string,
  variant: Variant,
): Promise<void> {
  const context = await buildContext(fixtureId);
  // Variant A = baseline sans skill coach (disableCoachSkill=true), addon TS
  // gardé pour comparaison équitable du pricing-domain. Variant B = cascade
  // complète avec skill coach.
  const result = await analyzeFixture({
    sport,
    sportAddon: ADDONS[sport],
    contextJson: context,
    disableCoachSkill: variant === "A",
  });

  const { closing_price, closing_book } = await findClosingPrice(
    fixtureId,
    result.output.market,
    result.output.side,
    result.output.line,
  );

  const sb = getSupabase();
  await sb.from("backtest_runs").insert({
    run_id: runId,
    sport_id: sport,
    fixture_id: fixtureId,
    variant,
    model: result.model,
    input_tokens: result.inputTokens,
    output_tokens: result.outputTokens,
    cache_creation_tokens: result.cacheCreationTokens,
    cache_read_tokens: result.cacheReadTokens,
    decision: result.output.decision,
    market: result.output.market,
    side: result.output.side,
    line: result.output.line,
    recommended_price: result.output.recommended_price,
    p_model: result.output.p_model,
    p_fair: result.output.p_fair,
    edge_pct: result.output.edge_pct,
    simulated_clv_pp: clvPp(result.output.recommended_price, closing_price),
    reasoning: result.output.reasoning_long,
  });

  logger.info(
    {
      runId,
      fixtureId,
      variant,
      decision: result.output.decision,
      edge: result.output.edge_pct,
      taken: result.output.recommended_price,
      closing_price,
      clv: clvPp(result.output.recommended_price, closing_price),
      cacheRead: result.cacheReadTokens,
    },
    "backtest:variant_done",
  );
}

async function main() {
  const sportRaw = arg("sport");
  const nRaw = arg("n") ?? "30";
  if (!sportRaw) {
    console.error("Usage: backtest-skill --sport foot|basket|tennis|ufc [--n 30]");
    process.exit(2);
  }
  const sport = assertSport(sportRaw);
  const n = Number(nRaw);
  if (!Number.isFinite(n) || n < 1 || n > 200) {
    console.error("--n must be in [1, 200]");
    process.exit(2);
  }

  const runId = randomUUID();
  logger.info({ runId, sport, n }, "backtest:start");

  await withRun(sport, "backtest", async (_, metrics) => {
    const fixtures = await loadFixturesForBacktest(sport, n);
    metrics.fixtures = fixtures.length;

    let done = 0;
    let errors = 0;
    for (const fx of fixtures) {
      for (const variant of ["A", "B"] as Variant[]) {
        try {
          await runVariant(runId, sport, fx.id, variant);
          done++;
        } catch (e) {
          errors++;
          logger.error({ fixtureId: fx.id, variant, err: String(e) }, "backtest:variant_error");
        }
      }
    }
    metrics.variants_done = done;
    metrics.variants_error = errors;
    metrics.run_id = runId;
  });

  // Récap A/B
  const sb = getSupabase();
  const { data: agg } = await sb
    .from("backtest_runs")
    .select("variant, edge_pct, simulated_clv_pp, decision")
    .eq("run_id", runId);
  if (agg) {
    const stats = (v: "A" | "B") => {
      const rows = agg.filter((r) => r.variant === v);
      const pushes = rows.filter((r) => r.decision === "push");
      const avg = (xs: Array<number | null>) => {
        const ns = xs.filter((x): x is number => x !== null);
        return ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : null;
      };
      return {
        n: rows.length,
        pushes: pushes.length,
        avg_edge: avg(pushes.map((r) => r.edge_pct)),
        avg_clv: avg(pushes.map((r) => r.simulated_clv_pp)),
      };
    };
    const A = stats("A");
    const B = stats("B");
    logger.info({ runId, A, B }, "backtest:summary");
    console.log(`\n=== Backtest ${runId} (${sport}, n=${n}) ===`);
    console.log(JSON.stringify({ A, B }, null, 2));
    if (A.avg_clv !== null && B.avg_clv !== null) {
      const delta = B.avg_clv - A.avg_clv;
      console.log(`\nDelta CLV (B - A) = ${delta.toFixed(3)} pp`);
      console.log(delta >= 0.5 ? "GO : skill apporte ≥ +0.5pp" : "NO-GO : skill apporte < +0.5pp, itérer");
    }
  }
}

main().catch((e) => {
  logger.error({ err: e instanceof Error ? `${e.message}\n${e.stack}` : String(e) }, "backtest:fatal");
  process.exit(1);
});
