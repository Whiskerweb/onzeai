import crypto from "node:crypto";
import type { Context } from "grammy";
import { supabase, getUserByTelegramId } from "../lib/supabase.js";

const APP_URL = process.env.APP_URL ?? "https://akyra.io";

export async function upgradeHandler(ctx: Context) {
  const tg = ctx.from;
  if (!tg) return;

  const user = await getUserByTelegramId(tg.id);
  if (!user) {
    await ctx.reply(`Active ton compte d'abord depuis ${APP_URL}/start.`);
    return;
  }
  if (user.subscription_status === "terminated" || user.subscription_status === "canceled") {
    await ctx.reply(
      `Ton compte est désactivé. Pour reprendre, repars depuis ${APP_URL}/start.`,
    );
    return;
  }

  const token = crypto.randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + 30 * 60_000).toISOString();

  const { error } = await supabase.from("auth_tokens").insert({
    token,
    user_id: user.id,
    purpose: "upgrade",
    expires_at: expiresAt,
  });
  if (error) {
    console.error("[upgrade] insert token", error);
    await ctx.reply("Souci technique de notre côté, réessaie dans 30 secondes.");
    return;
  }

  const url = `${APP_URL}/upgrade?token=${token}`;
  await ctx.reply(
    `Voilà ton lien pour changer de plan ou de coachs (valide 30 min) :\n\n${url}`,
    { link_preview_options: { is_disabled: true } },
  );
}
