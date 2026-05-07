import { assertSport, type SportId } from "../shared/config.js";
import { getSupabase } from "../shared/supabase.js";
import { logger } from "../shared/logger.js";
import { withRun } from "../shared/runs.js";

// Compute CLV pour les analyses où decision='push' et closing_price encore null.
// Pour chaque ligne : on cherche le dernier odds_snapshot pre-kickoff sur
// Pinnacle (puis fallback oddsapi_avg) qui matche (market, side, line) du pick,
// puis on compute clv_pp = (1/recommended − 1/closing) × 100.
//
// À cron daily 02:00 UTC après que les fixtures de la veille soient finished.
//
// Usage :
//   tsx --env-file=.env src/jobs/compute-clv.ts --sport foot
//   tsx --env-file=.env src/jobs/compute-clv.ts            (tous sports)

function arg(name: string): string | null {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return null;
  const v = process.argv[i + 1];
  return v && !v.startsWith("--") ? v : null;
}

const PREFERRED_BOOKS = ["pinnacle", "oddsapi_avg"];

async function findClosingForAnalysis(a: {
  fixture_id: string;
  market: string | null;
  side: string | null;
  line: number | null;
}): Promise<{ closing_price: number | null; closing_book: string | null }> {
  if (!a.market || !a.side) return { closing_price: null, closing_book: null };
  const sb = getSupabase();
  const { data: fx } = await sb.from("fixtures").select("kickoff").eq("id", a.fixture_id).single();
  if (!fx) return { closing_price: null, closing_book: null };

  for (const book of PREFERRED_BOOKS) {
    const q = sb
      .from("odds_snapshots")
      .select("price, book")
      .eq("fixture_id", a.fixture_id)
      .eq("book", book)
      .eq("market", a.market)
      .eq("side", a.side)
      .lte("taken_at", fx.kickoff)
      .order("taken_at", { ascending: false })
      .limit(1);
    const { data } = a.line === null ? await q.is("line", null) : await q.eq("line", a.line);
    const row = data?.[0];
    if (row) return { closing_price: row.price, closing_book: row.book };
  }
  return { closing_price: null, closing_book: null };
}

function clvPp(taken: number | null, closing: number | null): number | null {
  if (!taken || !closing) return null;
  return Number(((1 / taken - 1 / closing) * 100).toFixed(3));
}

async function processSport(sport: SportId): Promise<{ updated: number; skipped: number }> {
  const sb = getSupabase();
  // Cibles : analyses push avec recommended_price, closing_price encore null,
  // sur fixtures finished (donc closing line est figée).
  const { data: rows, error } = await sb
    .from("analyses")
    .select("id, fixture_id, market, side, line, recommended_price")
    .eq("sport_id", sport)
    .eq("decision", "push")
    .is("closing_price", null)
    .not("recommended_price", "is", null)
    .limit(500);
  if (error) throw new Error(`fetch analyses: ${error.message}`);

  let updated = 0;
  let skipped = 0;
  for (const r of rows ?? []) {
    // Vérifie que la fixture est bien finished (sinon close-line pas figée)
    const { data: fx } = await sb.from("fixtures").select("status").eq("id", r.fixture_id).single();
    if (!fx || fx.status !== "finished") {
      skipped++;
      continue;
    }
    const { closing_price, closing_book } = await findClosingForAnalysis(r);
    if (closing_price === null) {
      skipped++;
      continue;
    }
    const clv = clvPp(r.recommended_price as number, closing_price);
    const { error: updErr } = await sb
      .from("analyses")
      .update({ closing_price, closing_book, clv_pp: clv })
      .eq("id", r.id);
    if (updErr) {
      logger.error({ analysisId: r.id, err: updErr.message }, "compute-clv:update_error");
      skipped++;
      continue;
    }
    updated++;
  }
  return { updated, skipped };
}

async function main() {
  const sportArg = arg("sport");
  const targets: SportId[] = sportArg
    ? [assertSport(sportArg)]
    : (["foot", "basket", "tennis", "ufc"] as SportId[]);

  for (const sport of targets) {
    await withRun(sport, "clv", async (_, metrics) => {
      const { updated, skipped } = await processSport(sport);
      metrics.updated = updated;
      metrics.skipped = skipped;
      logger.info({ sport, updated, skipped }, "compute-clv:done");
    });
  }
}

main().catch((e) => {
  logger.error({ err: e instanceof Error ? `${e.message}\n${e.stack}` : String(e) }, "compute-clv:fatal");
  process.exit(1);
});
