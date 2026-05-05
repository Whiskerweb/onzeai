// Broadcast Telegram aux users existants annonçant le pivot multi-sport.
// Pour chaque user actif (trialing/active) avec un telegram_id, génère un token /upgrade
// (validité 24h pour le pivot, vs 30min en temps normal) puis envoie un message Telegram
// avec le magic link pré-rempli.
//
// Usage :
//   npx tsx --env-file=.env.local scripts/broadcast-sport-pivot.ts --dry-run
//   npx tsx --env-file=.env.local scripts/broadcast-sport-pivot.ts --confirm
//
// IMPORTANT : à exécuter UNE SEULE FOIS, après avoir tourné la migration SQL
// supabase/migrations/0003_sport_pivot_remap.sql.
//
// Required env :
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//   TELEGRAM_BOT_TOKEN, APP_URL (default https://akyra.io)

import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const APP_URL = process.env.APP_URL ?? "https://akyra.io";
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const PLAN_LABELS: Record<string, { name: string; max: number }> = {
  solo: { name: "Solo", max: 1 },
  squad: { name: "Squad", max: 2 },
  all: { name: "All Access", max: 4 },
};

function buildMessage(plan: string, magicLink: string): string {
  const cfg = PLAN_LABELS[plan] ?? { name: plan, max: 1 };
  return [
    `🎉 Onze.ai s'agrandit !`,
    ``,
    `On lance 3 nouveaux coachs : 🏀 *Curritique* (Basket), 🎾 *Federace* (Tennis), 🥊 *McTriple* (UFC).`,
    ``,
    `Ton plan *${cfg.name}* te donne droit à ${cfg.max} sport${cfg.max > 1 ? "s" : ""} — choisis-les ici :`,
    ``,
    magicLink,
    ``,
    `(Lien valide 24h. Foot reste sélectionné par défaut, tu peux ajouter ou changer.)`,
  ].join("\n");
}

async function sendTelegramMessage(chatId: number, text: string): Promise<{ ok: boolean; error?: string }> {
  if (!TG_TOKEN) return { ok: false, error: "TELEGRAM_BOT_TOKEN missing" };
  const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
      link_preview_options: { is_disabled: true },
    }),
  });
  const body = (await res.json()) as { ok?: boolean; description?: string };
  if (!body.ok) return { ok: false, error: body.description ?? `HTTP ${res.status}` };
  return { ok: true };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has("--dry-run");
  const confirm = args.has("--confirm");

  if (!dryRun && !confirm) {
    throw new Error("Pass --dry-run (preview only) or --confirm (actually send messages).");
  }
  if (!SB_URL || !SB_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env.");
  }
  if (!dryRun && !TG_TOKEN) {
    throw new Error("Missing TELEGRAM_BOT_TOKEN env (required for --confirm).");
  }

  const supabase = createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });

  const { data: users, error } = await supabase
    .from("users")
    .select("id, email, plan, telegram_id, telegram_username, subscription_status")
    .in("subscription_status", ["trialing", "active"])
    .not("telegram_id", "is", null);

  if (error) throw error;
  if (!users || users.length === 0) {
    console.log("[broadcast] no eligible users found.");
    return;
  }

  console.log(`[broadcast] ${users.length} eligible user(s).`);

  let sent = 0;
  let failed = 0;

  for (const u of users) {
    const token = crypto.randomBytes(24).toString("base64url");
    const expiresAt = new Date(Date.now() + 24 * 3600_000).toISOString();
    const magicLink = `${APP_URL}/upgrade?token=${token}`;
    const message = buildMessage(u.plan ?? "solo", magicLink);

    if (dryRun) {
      console.log(`[dry-run] tg=${u.telegram_id} email=${u.email} plan=${u.plan}`);
      console.log(`---\n${message}\n---`);
      continue;
    }

    const { error: tokenErr } = await supabase.from("auth_tokens").insert({
      token,
      user_id: u.id,
      purpose: "upgrade",
      expires_at: expiresAt,
    });
    if (tokenErr) {
      console.error(`[broadcast] token insert failed for user ${u.id}:`, tokenErr);
      failed++;
      continue;
    }

    const result = await sendTelegramMessage(u.telegram_id as unknown as number, message);
    if (!result.ok) {
      console.error(`[broadcast] telegram send failed for ${u.email}: ${result.error}`);
      failed++;
      continue;
    }
    sent++;

    // Throttle: Telegram bot API allows ~30 msg/sec, we go at 5/sec to be safe.
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`[broadcast] done. sent=${sent} failed=${failed} (dry-run=${dryRun})`);
}

main().catch((e) => {
  console.error("[broadcast] error:", e instanceof Error ? e.message : e);
  process.exit(1);
});
