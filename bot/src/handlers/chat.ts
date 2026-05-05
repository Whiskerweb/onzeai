import type { Context } from "grammy";
import {
  supabase,
  getUserByTelegramId,
  getUserCoaches,
  ACTIVE_STATUSES,
} from "../lib/supabase.js";
import { llm, MODEL } from "../lib/openrouter.js";
import { buildSystemPrompt, type RecentPick } from "../lib/prompt.js";
import { COACHES, findCoachByName, isCoachId, type CoachId } from "../lib/coaches.js";
import { checkQuota } from "../lib/quota.js";

const APP_URL = process.env.APP_URL ?? "https://onzeai.com";

export async function chatHandler(ctx: Context) {
  const tg = ctx.from;
  const text = ctx.message?.text;
  if (!tg || !text) return;
  // Ignore commands here — they're routed via dedicated handlers.
  if (text.startsWith("/")) {
    // BUT: `/dembefric question…` style → route to that coach's chat.
    const head = text.split(/\s+/, 1)[0]!.slice(1).toLowerCase();
    if (!findCoachByName(head)) return;
  }

  const user = await getUserByTelegramId(tg.id);
  if (!user) {
    await ctx.reply(`Pour activer ton compte, va sur ${APP_URL}/start.`);
    return;
  }

  if (!user.subscription_status || !ACTIVE_STATUSES.has(user.subscription_status)) {
    if (user.subscription_status === "terminated" || user.subscription_status === "canceled") {
      await ctx.reply(
        `Ton compte est désactivé. Pour réactiver et choisir un nouveau plan : ${APP_URL}/start.`,
      );
    } else {
      // past_due / unpaid / incomplete — there's still hope, the cron hasn't kicked in
      await ctx.reply(
        `Ton paiement n'est pas passé. Vérifie ta CB ou mets-la à jour, sinon ton accès sera coupé sous peu. Reprends depuis ${APP_URL}/start si besoin.`,
      );
    }
    return;
  }

  const owned = (await getUserCoaches(user.id)).filter((id): id is CoachId => isCoachId(id));
  if (owned.length === 0) {
    await ctx.reply("Aucun coach lié à ton compte. Reprends l'onboarding.");
    return;
  }

  // Resolve target coach
  let body = text;
  let target: CoachId | null = null;

  if (text.startsWith("/")) {
    const head = text.split(/\s+/, 1)[0]!.slice(1);
    const c = findCoachByName(head);
    if (c && owned.includes(c.id)) {
      target = c.id;
      body = text.slice(head.length + 1).trim();
      if (body.length === 0) {
        await ctx.reply(`OK, j'écoute. Pose ta question à ${COACHES[c.id].name}.`);
        return;
      }
    }
  }

  if (!target) {
    if (user.active_coach_id && owned.includes(user.active_coach_id as CoachId)) {
      target = user.active_coach_id as CoachId;
    } else {
      target = owned[0];
    }
  }

  // Quota
  const quota = await checkQuota(user.id, user.plan);
  if (!quota.ok) {
    await ctx.reply(
      `Quota chat atteint pour aujourd'hui (${quota.used}/${quota.limit}). Le compteur reset à minuit (Paris).`,
    );
    return;
  }

  // Persist user message immediately (counts towards quota even if LLM fails)
  await supabase.from("chat_messages").insert({
    user_id: user.id,
    coach_id: target,
    role: "user",
    content: body,
  });

  // Recent context: last 6 messages for this user/coach pair, plus 3 latest picks of that coach
  const { data: history } = await supabase
    .from("chat_messages")
    .select("role, content, created_at")
    .eq("user_id", user.id)
    .eq("coach_id", target)
    .order("created_at", { ascending: false })
    .limit(6);

  const { data: picks } = await supabase
    .from("picks")
    .select("pick_text, reasoning, cote, fixture_id, created_at")
    .eq("coach_id", target)
    .order("created_at", { ascending: false })
    .limit(3);

  const coach = COACHES[target];
  const systemPrompt = buildSystemPrompt(coach, (picks ?? []) as RecentPick[]);

  const turnHistory = (history ?? [])
    .reverse() // oldest → newest
    .map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: m.content as string,
    }));

  await ctx.replyWithChatAction("typing");

  let answer: string;
  let tokensUsed: number | null = null;
  try {
    const completion = await llm.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...turnHistory,
      ],
      max_tokens: 600,
      temperature: 0.7,
    });
    answer = completion.choices[0]?.message?.content?.trim() ?? "";
    tokensUsed = completion.usage?.total_tokens ?? null;
  } catch (e) {
    console.error("[chat] OpenRouter error", e);
    await ctx.reply(
      `${coach.name} est injoignable pour 30 secondes (problème côté modèle). Réessaie.`,
    );
    return;
  }

  if (!answer) {
    await ctx.reply(`${coach.name} n'a rien à dire pour l'instant. Reformule ?`);
    return;
  }

  await supabase.from("chat_messages").insert({
    user_id: user.id,
    coach_id: target,
    role: "assistant",
    content: answer,
    tokens_used: tokensUsed,
  });

  // Visual coach prefix so the user always knows who's speaking
  const prefix = `${coach.flag} *${coach.name}* :\n\n`;
  const reply = prefix + answer;

  // Telegram has 4096 char limit — chunk if needed.
  const chunks = chunk(reply, 3800);
  for (const c of chunks) {
    await ctx.reply(c, { parse_mode: "Markdown" });
  }

  if (quota.remaining - 1 <= 1 && Number.isFinite(quota.limit)) {
    await ctx.reply(
      `_Reste ${Math.max(0, quota.remaining - 1)} message(s) chat aujourd'hui._`,
      { parse_mode: "Markdown" },
    );
  }
}

function chunk(s: string, size: number): string[] {
  if (s.length <= size) return [s];
  const out: string[] = [];
  for (let i = 0; i < s.length; i += size) {
    out.push(s.slice(i, i + size));
  }
  return out;
}
