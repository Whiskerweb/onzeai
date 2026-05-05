import type { Context as HonoContext } from "hono";
import { bot } from "../bot.js";
import { supabase, ACTIVE_STATUSES } from "../lib/supabase.js";
import { COACHES, isCoachId } from "../lib/coaches.js";

type SupabaseWebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record?: PickRecord;
  old_record?: PickRecord;
};

type PickRecord = {
  id: string;
  coach_id: string;
  fixture_id: string | null;
  pick_text: string;
  reasoning: string | null;
  cote: number | string | null;
};

const SECRET = process.env.BROADCAST_SHARED_SECRET;

export async function broadcastRoute(c: HonoContext) {
  if (!SECRET) {
    return c.json({ error: "Server misconfigured (missing BROADCAST_SHARED_SECRET)" }, 500);
  }
  const sig = c.req.header("x-shared-secret");
  if (sig !== SECRET) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const payload = (await c.req.json().catch(() => null)) as SupabaseWebhookPayload | null;
  if (!payload || payload.type !== "INSERT" || !payload.record) {
    return c.json({ ignored: true }, 200);
  }
  const pick = payload.record;
  if (!isCoachId(pick.coach_id)) {
    return c.json({ ignored: true, reason: "unknown coach" }, 200);
  }

  // Find all subscribed active users with a Telegram link
  const { data: users, error } = await supabase
    .from("user_coaches")
    .select("user_id, users!inner(id, telegram_id, subscription_status)")
    .eq("coach_id", pick.coach_id);
  if (error) {
    console.error("[broadcast] user fetch error", error);
    return c.json({ error: "DB error" }, 500);
  }

  const formatted = formatPick(pick);

  let delivered = 0;
  let errors = 0;

  for (const row of users ?? []) {
    // supabase-js typing for joined inner select returns an object/array depending on RLS;
    // we coerce defensively.
    const u = (row as unknown as { users: { id: string; telegram_id: number | null; subscription_status: string | null } }).users;
    if (!u || !u.telegram_id || !u.subscription_status || !ACTIVE_STATUSES.has(u.subscription_status)) {
      continue;
    }
    try {
      const sent = await bot.api.sendMessage(u.telegram_id, formatted, {
        parse_mode: "Markdown",
      });
      await supabase.from("pick_deliveries").insert({
        pick_id: pick.id,
        user_id: u.id,
        telegram_message_id: sent.message_id,
      });
      delivered++;
    } catch (e) {
      errors++;
      const msg = e instanceof Error ? e.message : "send error";
      await supabase.from("pick_deliveries").insert({
        pick_id: pick.id,
        user_id: u.id,
        telegram_message_id: null,
        error: msg,
      });
    }
  }

  await supabase
    .from("picks")
    .update({ broadcasted_at: new Date().toISOString() })
    .eq("id", pick.id);

  return c.json({ delivered, errors });
}

function formatPick(p: PickRecord): string {
  const coach = isCoachId(p.coach_id) ? COACHES[p.coach_id] : null;
  const header = coach ? `${coach.flag} *${coach.name}* (${coach.league})` : "Onze.ai";
  const cote = p.cote != null ? ` · cote *×${p.cote}*` : "";
  const fixture = p.fixture_id ? `\n_${p.fixture_id}_` : "";
  const reasoning = p.reasoning ? `\n\n${p.reasoning}` : "";
  return `${header}${fixture}\n\n🎯 *${escapeMd(p.pick_text)}*${cote}${reasoning}\n\n_18+ — joue responsable._`;
}

function escapeMd(s: string): string {
  // Lightweight escape for Markdown v1 (Telegram). Avoid asterisks/underscores breaking layout.
  return s.replace(/([*_`\[])/g, "\\$1");
}
