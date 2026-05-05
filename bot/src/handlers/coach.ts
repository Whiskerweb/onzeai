import type { Context } from "grammy";
import { supabase, getUserByTelegramId, getUserCoaches } from "../lib/supabase.js";
import { COACHES, findCoachByName, isCoachId, type CoachId } from "../lib/coaches.js";

export async function coachCommandHandler(ctx: Context) {
  const tg = ctx.from;
  if (!tg) return;

  const user = await getUserByTelegramId(tg.id);
  if (!user) {
    await ctx.reply("Active ton compte d'abord depuis le site.");
    return;
  }

  const arg = (ctx.match ?? "").toString().trim();
  const allNames = Object.values(COACHES)
    .map((c) => c.name)
    .join(", ");
  const exampleName = COACHES.foot.name.toLowerCase();
  if (!arg) {
    await ctx.reply(
      `Utilise \`/coach <nom>\` (ex: \`/coach ${exampleName}\`). Ou \`/coachs\` pour voir ta sélection.`,
      { parse_mode: "Markdown" },
    );
    return;
  }

  const target = findCoachByName(arg);
  if (!target) {
    await ctx.reply(`Coach inconnu : "${arg}". Coachs : ${allNames}.`);
    return;
  }

  const owned = await getUserCoaches(user.id);
  if (!owned.includes(target.id)) {
    await ctx.reply(
      `${target.name} n'est pas dans ta sélection. Mets à jour ton plan depuis le site.`,
    );
    return;
  }

  await supabase
    .from("users")
    .update({ active_coach_id: target.id })
    .eq("id", user.id);

  await ctx.reply(`Coach actif : ${target.name} ${target.flag}.`);
}

export async function coachListHandler(ctx: Context) {
  const tg = ctx.from;
  if (!tg) return;
  const user = await getUserByTelegramId(tg.id);
  if (!user) {
    await ctx.reply("Active ton compte d'abord depuis le site.");
    return;
  }
  const owned = await getUserCoaches(user.id);
  if (owned.length === 0) {
    await ctx.reply("Aucun coach lié à ton compte. Recommence l'onboarding depuis le site.");
    return;
  }
  const lines = owned
    .filter((id): id is CoachId => isCoachId(id))
    .map((id) => {
      const c = COACHES[id];
      const active = user.active_coach_id === id ? " ← actif" : "";
      return `• ${c.flag} *${c.name}* (${c.sport})${active}`;
    });
  await ctx.reply(lines.join("\n"), { parse_mode: "Markdown" });
}
