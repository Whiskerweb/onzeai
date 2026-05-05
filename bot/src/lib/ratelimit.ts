// In-memory rate limiting for the bot.
// The bot runs on a single Fly.io VM, so a Map is enough — no Redis needed.
//
// Two protections:
//   1. Spam throttle  — max 1 user message per BURST_WINDOW_MS per Telegram user
//   2. LLM concurrency — at most 1 in-flight Gemma call per user, so a fast-typer
//      can't trigger N parallel completions.

const BURST_WINDOW_MS = 2_000;

const lastSeen = new Map<number, number>();
const inflight = new Set<number>();

/** Returns true if the user is allowed to send a message right now. */
export function checkSpamRate(telegramId: number): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  const last = lastSeen.get(telegramId);
  if (last && now - last < BURST_WINDOW_MS) {
    return { ok: false, retryAfterMs: BURST_WINDOW_MS - (now - last) };
  }
  lastSeen.set(telegramId, now);
  return { ok: true, retryAfterMs: 0 };
}

/** Acquire an in-flight slot. Returns false if the user already has one. */
export function tryAcquireLLM(telegramId: number): boolean {
  if (inflight.has(telegramId)) return false;
  inflight.add(telegramId);
  return true;
}

export function releaseLLM(telegramId: number): void {
  inflight.delete(telegramId);
}

// Periodic GC so the Maps don't grow forever on long-running deployments.
const GC_INTERVAL_MS = 60 * 60 * 1000;
const GC_MAX_AGE_MS = 24 * 60 * 60 * 1000;

setInterval(() => {
  const cutoff = Date.now() - GC_MAX_AGE_MS;
  for (const [id, ts] of lastSeen) {
    if (ts < cutoff) lastSeen.delete(id);
  }
}, GC_INTERVAL_MS).unref?.();
