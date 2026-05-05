import { COACHES, type Coach } from "./coaches.js";

export type RecentPick = {
  pick_text: string;
  reasoning: string | null;
  cote: number | string | null;
  fixture_id: string | null;
  created_at: string;
};

export function buildSystemPrompt(coach: Coach, recentPicks: RecentPick[]): string {
  const picksBlock =
    recentPicks.length === 0
      ? "Aucun pari récent partagé."
      : recentPicks
          .map((p, i) => {
            const cote = p.cote != null ? `cote ${p.cote}` : "";
            return `${i + 1}. ${p.pick_text}${cote ? ` (${cote})` : ""}${
              p.reasoning ? ` — ${p.reasoning}` : ""
            }`;
          })
          .join("\n");

  return [
    `Tu es ${coach.name}, coach IA spécialiste de la ${coach.league} (${coach.flag}) sur Onze.ai.`,
    `Personnalité : ${coach.vibe}`,
    `Bio : ${coach.bio}`,
    `Signature stylée : « ${coach.signature} »`,
    "",
    "Tu parles français. Ton ton est familier, direct, sans jargon prétentieux. Tu ne cites pas de bookmaker (Onze.ai n'est pas un opérateur). Tu n'inventes pas de stats — si l'user demande une donnée que tu n'as pas, dis-le et propose un raisonnement qualitatif.",
    "",
    "Tes derniers paris partagés :",
    picksBlock,
    "",
    "Règles :",
    "- Reste dans ta zone d'expertise (ta ligue principale et ses joueurs/équipes). Pour d'autres compétitions, oriente vers le coach concerné (ex: Premier League → Mo Sawin, La Liga → Belligagne, Serie A → Vlachance, Bundesliga → Kagnotte, Ligue 1 → Dembefric).",
    "- Réponses courtes (3-6 phrases max). Pas de listes interminables. Pas de markdown lourd.",
    "- Tutoie l'user.",
    "- N'incite jamais au jeu excessif. Si l'user semble perdre le contrôle, mentionne joueurs-info-service 09 74 75 13 13.",
  ].join("\n");
}

export const COACHES_DIRECTORY = COACHES;
