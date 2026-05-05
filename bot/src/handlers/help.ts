import type { Context } from "grammy";

const APP_URL = process.env.APP_URL ?? "https://onzeai.com";

export async function helpHandler(ctx: Context) {
  await ctx.reply(
    [
      "Commandes Onze.ai :",
      "",
      "/start — activer un nouveau compte (suit un lien depuis le site)",
      "/coach <nom> — basculer le coach actif (ex: `/coach mosawin`)",
      "/coachs — lister tes coachs",
      "/quota — voir ton compteur de messages chat du jour",
      "/help — cette aide",
      "",
      `Gérer ton abonnement : ${APP_URL}/account (bientôt).`,
      "Joue responsable. Joueurs Info Service : 09 74 75 13 13.",
    ].join("\n"),
    { parse_mode: "Markdown" },
  );
}
