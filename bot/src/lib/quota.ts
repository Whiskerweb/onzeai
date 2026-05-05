import { supabase, type PlanId } from "./supabase.js";

const LIMITS: Record<PlanId, number> = {
  solo: 3,
  squad: 20,
  all: Number.POSITIVE_INFINITY,
};

export type QuotaResult = {
  ok: boolean;
  used: number;
  limit: number;
  remaining: number;
};

function startOfDayParisISO(): string {
  // Paris timezone is UTC+1 (winter) or UTC+2 (summer). For a quota that resets at midnight Paris,
  // we use the user's perceived local day. Using Europe/Paris via Intl gives us a reliable date string.
  const formatter = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  // Treat midnight Paris as roughly UTC by stamping a Z; close enough for daily quotas.
  return new Date(`${y}-${m}-${d}T00:00:00+02:00`).toISOString();
}

export async function checkQuota(userId: string, plan: PlanId): Promise<QuotaResult> {
  const limit = LIMITS[plan];
  if (!Number.isFinite(limit)) return { ok: true, used: 0, limit, remaining: Infinity };

  const since = startOfDayParisISO();
  const { count, error } = await supabase
    .from("chat_messages")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("role", "user")
    .gte("created_at", since);
  if (error) {
    console.error("[quota] count error", error);
    return { ok: false, used: 0, limit, remaining: 0 };
  }
  const used = count ?? 0;
  return { ok: used < limit, used, limit, remaining: Math.max(0, limit - used) };
}
