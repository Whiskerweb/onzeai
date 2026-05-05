import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error(
    "[supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in bot environment.",
  );
}

export const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Plan / status helpers shared across handlers.
export type PlanId = "solo" | "squad" | "all";

export type OnzeUser = {
  id: string;
  email: string;
  telegram_id: number | null;
  telegram_username: string | null;
  telegram_first_name: string | null;
  plan: PlanId;
  active_coach_id: string | null;
  subscription_status: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  linked_at: string | null;
};

export const ACTIVE_STATUSES = new Set(["trialing", "active"]);

export async function getUserByTelegramId(telegramId: number): Promise<OnzeUser | null> {
  const { data, error } = await supabase
    .from("users")
    .select(
      "id, email, telegram_id, telegram_username, telegram_first_name, plan, active_coach_id, subscription_status, trial_ends_at, current_period_end, linked_at",
    )
    .eq("telegram_id", telegramId)
    .maybeSingle();
  if (error) {
    console.error("[supabase] getUserByTelegramId", error);
    return null;
  }
  return (data as OnzeUser | null) ?? null;
}

export async function getUserCoaches(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("user_coaches")
    .select("coach_id")
    .eq("user_id", userId);
  if (error) {
    console.error("[supabase] getUserCoaches", error);
    return [];
  }
  return (data ?? []).map((r) => r.coach_id as string);
}
