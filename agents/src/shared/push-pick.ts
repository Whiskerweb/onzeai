import { getConfig } from "./config.js";
import { logger } from "./logger.js";

export type PushPickInput = {
  coach_id: "foot" | "basket" | "tennis" | "ufc";
  pick_text: string;
  cote?: number | null;
  fixture_id?: string | null;
  reasoning?: string | null;
};

export type PushPickResult = {
  ok: boolean;
  pick?: { id: string; coach_id: string; pick_text: string; cote: number | null; fixture_id: string | null; created_at: string };
  error?: string;
};

// POST /api/picks (Vercel) avec header x-picks-secret. L'insert déclenche le
// Database Webhook Supabase → bot/broadcast → Telegram.
export async function pushPick(input: PushPickInput): Promise<PushPickResult> {
  const cfg = getConfig();

  if (cfg.DRY_RUN) {
    logger.warn({ input }, "push-pick:dry_run_skipped");
    return { ok: false, error: "DRY_RUN=1, push skipped" };
  }

  const resp = await fetch(cfg.PICKS_INGEST_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-picks-secret": cfg.PICKS_INGEST_SECRET,
    },
    body: JSON.stringify(input),
  });

  const json = (await resp.json().catch(() => ({}))) as PushPickResult;
  if (!resp.ok) {
    logger.error({ status: resp.status, body: json }, "push-pick:http_error");
    return { ok: false, error: `HTTP ${resp.status}: ${json.error ?? "unknown"}` };
  }
  logger.info({ pickId: json.pick?.id, coach: input.coach_id }, "push-pick:ok");
  return json;
}
