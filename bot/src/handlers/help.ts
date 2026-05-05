import type { Context } from "grammy";
import { COACHES } from "../lib/coaches.js";

const APP_URL = process.env.APP_URL ?? "https://akyra.io";

export async function helpHandler(ctx: Context) {
  const exampleName = COACHES.foot.name.toLowerCase();
  await ctx.reply(
    [
      "Commandes Onze.ai :",
      "",
      "/coachs — voir tes coachs et lequel est actif",
      `/coach <nom> — basculer le coach actif (ex: \`/coach ${exampleName}\`)`,
      "/quota — compteur de messages chat du jour",
      "/upgrade — changer de plan ou de coachs (lien sécurisé)",
      "/help — cette aide",
      "",
      "*Comment chatter avec un coach :*",
      "Sans préfixe → c'est ton coach actif qui répond.",
      `Avec préfixe \`/<nom> ton message…\` → tu parles directement à ce coach (ex: \`/${exampleName} tu sens quoi sur PSG-OM ?\`).`,
      "",
      `Réactiver ou s'inscrire : ${APP_URL}/start.`,
      "Joue responsable. Joueurs Info Service : 09 74 75 13 13.",
    ].join("\n"),
    { parse_mode: "Markdown" },
  );
}
