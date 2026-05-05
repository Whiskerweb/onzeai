import type { Context } from "grammy";

const APP_URL = process.env.APP_URL ?? "https://akyra.io";

export async function helpHandler(ctx: Context) {
  await ctx.reply(
    [
      "Commandes Onze.ai :",
      "",
      "/coachs — voir tes coachs et lequel est actif",
      "/coach <nom> — basculer le coach actif (ex: `/coach mosawin`)",
      "/quota — compteur de messages chat du jour",
      "/upgrade — changer de plan ou de coachs (lien sécurisé)",
      "/help — cette aide",
      "",
      "*Comment chatter avec un coach :*",
      "Sans préfixe → c'est ton coach actif qui répond.",
      "Avec préfixe `/<nom> ton message…` → tu parles directement à ce coach (ex: `/dembefric tu sens quoi sur PSG-OM ?`).",
      "",
      `Réactiver ou s'inscrire : ${APP_URL}/start.`,
      "Joue responsable. Joueurs Info Service : 09 74 75 13 13.",
    ].join("\n"),
    { parse_mode: "Markdown" },
  );
}
