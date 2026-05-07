import { z } from "zod";
import { SPORTS } from "./config.js";

// ─── Analyse output (ce que Claude doit retourner pour chaque fixture) ────
//
// Le pipeline insère cet output dans public.analyses. Si decision === 'push' et
// edge_pct >= MIN_EDGE_PCT, le pick est aussi POST à /api/picks pour broadcast.

export const AnalysisOutput = z.object({
  decision: z.enum(["push", "pass", "watch"]),
  market: z.string().nullable(),                  // '1x2'|'ah'|'ou'|'btts'|'ml'|'spread'|'method'|'total'|...
  side: z.string().nullable(),                    // 'home'|'away'|'draw'|'over'|'under'|'fighter_a'|...
  line: z.number().nullable(),                    // handicap / total ; null pour 1X2 / ML / method
  recommended_price: z.number().min(1.01).nullable(),
  p_model: z.number().min(0).max(1).nullable(),
  p_fair: z.number().min(0).max(1).nullable(),
  edge_pct: z.number().nullable(),
  expected_clv_pp: z.number().nullable(),
  pick_text: z.string().min(3),                   // formulation FR à pousser via /api/picks
  reasoning_short: z.string().min(10),             // 1-2 phrases voix sports-bettor-pro pour le `reasoning` du pick
  reasoning_long: z.string(),                      // détaillé pour public.analyses.reasoning
  analysis_card: z.string().optional(),            // fiche markdown 10 sections (football-pronostics) — rendue sur /picks/[id]
  coach_voice_compliant: z.boolean().optional(),   // self-check : pick_text/reasoning_short matchent la voix coach
  sanity_check_passed: z.boolean().optional(),     // self-check : p_model dans bornes plausibles du sport
});
export type AnalysisOutput = z.infer<typeof AnalysisOutput>;

// ─── Sport ↔ coach_id ────────────────────────────────────────────────
// Le coach_id côté DB est le même string que le sport_id. Si demain on splitte
// (ex: deux coachs basket NBA + EuroLeague), changer ici uniquement.
export function sportToCoachId(sport: (typeof SPORTS)[number]): string {
  return sport;
}
