import type { Context } from "grammy";
import { supabase } from "../lib/supabase.js";
import { COACHES, type CoachId } from "../lib/coaches.js";

const APP_URL = process.env.APP_URL ?? "https://onzeai.com";

export async function startHandler(ctx: Context) {
  const tg = ctx.from;
  if (!tg) return;

  // /start <token> sets ctx.match (Grammy)
  const token = (ctx.match ?? "").toString().trim();

  if (!token) {
    await ctx.reply(
      `Bienvenue sur Onze.ai 👋\n\nPour activer ton compte et choisir tes coachs, démarre depuis ${APP_URL}/start.\n\nUne fois ton paiement validé, tu reviens ici et tout se débloque.`,
    );
    return;
  }

  // Look up token
  const { data: tokenRow, error: tokenErr } = await supabase
    .from("auth_tokens")
    .select("token, user_id, expires_at, claimed_at")
    .eq("token", token)
    .maybeSingle();
  if (tokenErr) {
    console.error("[start] token lookup error", tokenErr);
    await ctx.reply("Souci technique de notre côté, réessaie dans 30 secondes.");
    return;
  }
  if (!tokenRow) {
    await ctx.reply(
      `Lien invalide ou déjà utilisé. Recommence depuis ${APP_URL}/start si besoin.`,
    );
    return;
  }
  if (tokenRow.claimed_at) {
    await ctx.reply(
      "Ce lien a déjà servi. Si tu n'as plus accès au compte, contacte-nous depuis le site.",
    );
    return;
  }
  if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
    await ctx.reply(
      `Ce lien a expiré (30 minutes). Régénère-le depuis ${APP_URL}/start.`,
    );
    return;
  }

  // Claim: link telegram identity to the user
  const { error: updateErr } = await supabase
    .from("users")
    .update({
      telegram_id: tg.id,
      telegram_username: tg.username ?? null,
      telegram_first_name: tg.first_name ?? null,
      linked_at: new Date().toISOString(),
    })
    .eq("id", tokenRow.user_id);
  if (updateErr) {
    console.error("[start] update user error", updateErr);
    await ctx.reply("Souci technique au moment de lier ton compte. Réessaie dans 30 secondes.");
    return;
  }

  await supabase
    .from("auth_tokens")
    .update({ claimed_at: new Date().toISOString() })
    .eq("token", token);

  // Fetch user's coaches for the welcome message
  const { data: ucs } = await supabase
    .from("user_coaches")
    .select("coach_id")
    .eq("user_id", tokenRow.user_id);

  const coachNames = (ucs ?? [])
    .map((r) => COACHES[r.coach_id as CoachId]?.name)
    .filter(Boolean) as string[];

  const list =
    coachNames.length === 1
      ? coachNames[0]
      : coachNames.slice(0, -1).join(", ") + " et " + coachNames.at(-1);

  const firstName = tg.first_name ? `, ${tg.first_name}` : "";

  await ctx.reply(
    [
      `Compte activé${firstName} ✅`,
      "",
      `Tu suis ${list}.`,
      "Tu vas recevoir leurs paris ici dès qu'ils sont publiés.",
      "",
      "Pour discuter avec un coach, écris-moi simplement.",
      `Si tu suis plusieurs coachs : \`/coach <nom>\` pour basculer (ex: \`/coach ${COACHES.foot.name.toLowerCase()}\`), ou préfixe avec \`/${COACHES.foot.name.toLowerCase()} ton message…\`.`,
      "",
      "Tape /help pour la liste des commandes.",
    ].join("\n"),
    { parse_mode: "Markdown" },
  );
}
