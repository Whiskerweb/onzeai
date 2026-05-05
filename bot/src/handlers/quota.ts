import type { Context } from "grammy";
import { getUserByTelegramId } from "../lib/supabase.js";
import { checkQuota } from "../lib/quota.js";

export async function quotaCommandHandler(ctx: Context) {
  const tg = ctx.from;
  if (!tg) return;
  const user = await getUserByTelegramId(tg.id);
  if (!user) {
    await ctx.reply("Active ton compte d'abord.");
    return;
  }
  const q = await checkQuota(user.id, user.plan);
  if (!Number.isFinite(q.limit)) {
    await ctx.reply("Plan All Access — chat illimité.");
    return;
  }
  await ctx.reply(`Aujourd'hui : ${q.used}/${q.limit} messages chat utilisés.`);
}
