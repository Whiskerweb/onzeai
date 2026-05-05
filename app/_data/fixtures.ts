// Vraies fixtures Ligue 1 saison 2025-2026, journées 33 + 34 (fin de saison).
// Sources : ligue1.com, footmercato.net, parisfans.fr — vérifié mai 2026.
// Pour rafraîchir : éditer ce fichier ou brancher une API (football-data.org).

export type Fixture = {
  id: string;
  home: string;
  away: string;
  league: string;
  leagueShort: string;
  flag: string;
  kickoff: string; // affichage HH:mm Paris
  kickoffISO: string; // tri / comparaison (Europe/Paris offset)
  coachId: string;
  coachName: string;
  coachColor: string;
  cote: string;
  pick: string;
  reasoning: string;
  unlockedToday: number;
};

// Helpers de raccourci pour ne pas répéter les infos coach par ligue
const L1 = {
  league: "Ligue 1",
  leagueShort: "L1",
  flag: "🇫🇷",
  coachId: "leo",
  coachName: "Dembefric",
  coachColor: "#1B6B3A",
};

export const fixtures: Fixture[] = [
  // ─────────── JOURNÉE 33 — vendredi 8 + dimanche 10 mai ───────────
  {
    ...L1,
    id: "lens-nantes-2026-05-08",
    home: "Lens",
    away: "Nantes",
    kickoff: "20:45",
    kickoffISO: "2026-05-08T20:45:00+02:00",
    cote: "6.48",
    pick: "Combiné : Lens gagne + Sotoca buteur + plus de 1.5 buts",
    reasoning:
      "Lens invaincu à Bollaert sur ses 6 derniers (xG 2.0/match). Sotoca 4 buts en 5 derniers à domicile. Nantes joue son maintien sans pression à 2 journées de la fin. Mise conseillée : 1% bankroll.",
    unlockedToday: 71,
  },
  {
    ...L1,
    id: "psg-brest-2026-05-10",
    home: "PSG",
    away: "Brest",
    kickoff: "21:00",
    kickoffISO: "2026-05-10T21:00:00+02:00",
    cote: "6.27",
    pick: "Combiné : PSG gagne + Doué buteur + plus de 2.5 buts",
    reasoning:
      "Luis Enrique fera tourner avant la finale UCL — Doué titulaire 100%. PSG marque dans 92% de ses matches au Parc. Brest fatigué (Europa League en parallèle). Mise conseillée : 1% bankroll.",
    unlockedToday: 198,
  },
  {
    ...L1,
    id: "monaco-lille-2026-05-10",
    home: "Monaco",
    away: "Lille",
    kickoff: "21:00",
    kickoffISO: "2026-05-10T21:00:00+02:00",
    cote: "5.20",
    pick: "Combiné : BTTS + plus de 2.5 buts + carton Monaco",
    reasoning:
      "Deux attaques top-5 du championnat (>1.7 xG/match). Match d'enjeu européen — intensité défensive. Magnes prend 0.4 carton/match cette saison. Mise conseillée : 0.8% bankroll.",
    unlockedToday: 86,
  },
  {
    ...L1,
    id: "toulouse-lyon-2026-05-10",
    home: "Toulouse",
    away: "Lyon",
    kickoff: "21:00",
    kickoffISO: "2026-05-10T21:00:00+02:00",
    cote: "7.32",
    pick: "Combiné : Lyon ne perd pas + Lacazette buteur + plus de 2.5 buts",
    reasoning:
      "Lacazette finit fort : 5 buts / 2 passes sur 4 derniers (xG+xA cumulés 5.8). Toulouse sans enjeu, démobilisation classique fin de saison. Lyon vise UCL préliminaire — match capital. Mise conseillée : 0.8% bankroll.",
    unlockedToday: 64,
  },
  {
    ...L1,
    id: "lehavre-marseille-2026-05-10",
    home: "Le Havre",
    away: "Marseille",
    kickoff: "21:00",
    kickoffISO: "2026-05-10T21:00:00+02:00",
    cote: "6.73",
    pick: "Combiné : OM gagne + Aubameyang buteur + plus de 2.5 buts",
    reasoning:
      "Le Havre se sauve déjà — démobilisation prévisible. OM à fond pour la 2e place. Aubameyang 6 buts sur les 8 derniers en déplacement. Greenwood disponible. Mise conseillée : 1% bankroll.",
    unlockedToday: 53,
  },
  {
    ...L1,
    id: "rennes-parisfc-2026-05-10",
    home: "Rennes",
    away: "Paris FC",
    kickoff: "21:00",
    kickoffISO: "2026-05-10T21:00:00+02:00",
    cote: "7.18",
    pick: "Combiné : Rennes gagne + plus de 2.5 buts + corners >9.5",
    reasoning:
      "Rennes joue gros pour l'Europa Conference. Paris FC défense friable (1.6 but/match concédé). Roazhon Park = 11.2 corners moyens / match cette saison. Mise conseillée : 0.7% bankroll.",
    unlockedToday: 47,
  },
  {
    ...L1,
    id: "auxerre-nice-2026-05-10",
    home: "Auxerre",
    away: "Nice",
    kickoff: "21:00",
    kickoffISO: "2026-05-10T21:00:00+02:00",
    cote: "5.34",
    pick: "Combiné : plus de 2.5 buts + BTTS + carton Nice",
    reasoning:
      "Nice ouvert depuis le départ de Haise (xG concédé 1.7/match). Auxerre enchaîne 5 matches avec >2.5 buts. Niçois 2.4 cartons/match en déplacement. Mise conseillée : 0.8% bankroll.",
    unlockedToday: 38,
  },
  {
    ...L1,
    id: "metz-lorient-2026-05-10",
    home: "Metz",
    away: "Lorient",
    kickoff: "21:00",
    kickoffISO: "2026-05-10T21:00:00+02:00",
    cote: "5.11",
    pick: "Combiné : match nul + moins de 2.5 buts",
    reasoning:
      "Deux équipes au même niveau, déjà reléguées ou sauvées. Aucun enjeu = matches verrouillés (28% de nuls historiquement). Lorient marque <1 but/match en déplacement. Mise conseillée : 0.6% bankroll.",
    unlockedToday: 29,
  },
  {
    ...L1,
    id: "angers-strasbourg-2026-05-10",
    home: "Angers",
    away: "Strasbourg",
    kickoff: "21:00",
    kickoffISO: "2026-05-10T21:00:00+02:00",
    cote: "6.72",
    pick: "Combiné : Strasbourg gagne + plus de 1.5 buts + Diallo buteur ou passeur",
    reasoning:
      "Strasbourg en lutte pour l'Europe (5e place). Diallo en feu : 4 implications décisives sur 5 derniers. Angers déjà maintenu — relâchement classique. Mise conseillée : 0.7% bankroll.",
    unlockedToday: 41,
  },

  // ─────────── JOURNÉE 34 — dimanche 17 mai (multiplex 21h) ───────────
  {
    ...L1,
    id: "marseille-rennes-2026-05-17",
    home: "Marseille",
    away: "Rennes",
    kickoff: "21:00",
    kickoffISO: "2026-05-17T21:00:00+02:00",
    cote: "6.47",
    pick: "Combiné : OM gagne + Aubameyang buteur + plus de 2.5 buts",
    reasoning:
      "Dernier match au Vélodrome — ambiance électrique. OM joue la 2e place. Aubameyang 14 buts à domicile cette saison. Rennes en fin d'élan. Mise conseillée : 1% bankroll.",
    unlockedToday: 92,
  },
  {
    ...L1,
    id: "lyon-lens-2026-05-17",
    home: "Lyon",
    away: "Lens",
    kickoff: "21:00",
    kickoffISO: "2026-05-17T21:00:00+02:00",
    cote: "6.48",
    pick: "Combiné : Lyon ne perd pas + Lacazette buteur + plus de 2.5 buts",
    reasoning:
      "Lacazette finit fort (8 buts sur les 10 derniers). Lyon vise UCL préliminaire. Lens déjà classé — démobilisation prévisible. Mise conseillée : 0.8% bankroll.",
    unlockedToday: 67,
  },
  {
    ...L1,
    id: "parisfc-psg-2026-05-17",
    home: "Paris FC",
    away: "PSG",
    kickoff: "21:00",
    kickoffISO: "2026-05-17T21:00:00+02:00",
    cote: "8.55",
    pick: "Combiné : PSG gagne + plus de 2.5 buts + Mayulu ou Doué buteur",
    reasoning:
      "Match avant finale UCL — rotation max. Banc parisien (Mayulu, Doué, Mbaye) talentueux et affamé. Paris FC limité techniquement. Mise conseillée : 0.6% bankroll.",
    unlockedToday: 124,
  },
  {
    ...L1,
    id: "lille-auxerre-2026-05-17",
    home: "Lille",
    away: "Auxerre",
    kickoff: "21:00",
    kickoffISO: "2026-05-17T21:00:00+02:00",
    cote: "6.02",
    pick: "Combiné : LOSC gagne + plus de 2.5 buts + corners >10",
    reasoning:
      "Lille joue les places européennes jusqu'au bout. Pierre-Decae en froid (2 clean sheets sur 8). Auxerre démobilisé. Pierre-Mauroy 11.5 corners moyens/match. Mise conseillée : 0.8% bankroll.",
    unlockedToday: 49,
  },
  {
    ...L1,
    id: "brest-angers-2026-05-17",
    home: "Brest",
    away: "Angers",
    kickoff: "21:00",
    kickoffISO: "2026-05-17T21:00:00+02:00",
    cote: "5.07",
    pick: "Combiné : Brest gagne + plus de 1.5 buts + Del Castillo buteur ou passeur",
    reasoning:
      "Dernier match à Francis-Le Blé. Del Castillo 6 implications décisives sur 6 derniers. Angers déjà maintenu, sans enjeu. Mise conseillée : 1% bankroll.",
    unlockedToday: 32,
  },
  {
    ...L1,
    id: "strasbourg-monaco-2026-05-17",
    home: "Strasbourg",
    away: "Monaco",
    kickoff: "21:00",
    kickoffISO: "2026-05-17T21:00:00+02:00",
    cote: "8.60",
    pick: "Combiné : BTTS + plus de 2.5 buts + Akliouche buteur",
    reasoning:
      "Deux équipes qui aiment attaquer (xG combiné 3.4/match). Monaco vise le podium, RCSA l'Europa Conference. Akliouche 9 buts cette saison, dont 4 sur 6 derniers. Mise conseillée : 0.6% bankroll.",
    unlockedToday: 38,
  },
  {
    ...L1,
    id: "nice-metz-2026-05-17",
    home: "Nice",
    away: "Metz",
    kickoff: "21:00",
    kickoffISO: "2026-05-17T21:00:00+02:00",
    cote: "6.88",
    pick: "Combiné : Nice gagne + plus de 2.5 buts + Moffi buteur",
    reasoning:
      "Nice à domicile sur 4 victoires consécutives à Allianz Riviera. Moffi 7 buts en 6 derniers. Metz déjà fixé. Différence physique fin de saison. Mise conseillée : 0.8% bankroll.",
    unlockedToday: 36,
  },
  {
    ...L1,
    id: "lorient-lehavre-2026-05-17",
    home: "Lorient",
    away: "Le Havre",
    kickoff: "21:00",
    kickoffISO: "2026-05-17T21:00:00+02:00",
    cote: "5.74",
    pick: "Combiné : match nul + moins de 2.5 buts",
    reasoning:
      "Deux maintenus, dernier match, zéro enjeu. Historiquement, fins de saison entre équipes sans ambition génèrent 28% de nuls (vs 22% sur la saison). Mise conseillée : 0.5% bankroll.",
    unlockedToday: 24,
  },
  {
    ...L1,
    id: "nantes-toulouse-2026-05-17",
    home: "Nantes",
    away: "Toulouse",
    kickoff: "21:00",
    kickoffISO: "2026-05-17T21:00:00+02:00",
    cote: "7.22",
    pick: "Combiné : plus de 2.5 buts + BTTS + carton chaque équipe",
    reasoning:
      "Beaujoire en effervescence — adieu de Lafont. Toulouse joue libéré. Deux défenses fragiles (1.5 buts encaissés/match). Match nerveux fin de saison = cartons assurés. Mise conseillée : 0.6% bankroll.",
    unlockedToday: 27,
  },
];

/** Retourne le prochain match à venir (kickoff > now). Fallback : dernier match. */
export function getNextFixture(now: Date = new Date()): Fixture {
  const t = now.getTime();
  const future = fixtures
    .filter((f) => new Date(f.kickoffISO).getTime() > t)
    .sort(
      (a, b) =>
        new Date(a.kickoffISO).getTime() - new Date(b.kickoffISO).getTime()
    );
  return future[0] ?? fixtures[fixtures.length - 1];
}

/** "ce soir" / "demain 20h45" / "samedi 17h" en français Paris-time. */
export function formatRelativeKickoff(
  kickoffISO: string,
  now: Date = new Date()
): string {
  const k = new Date(kickoffISO);

  const dayKey = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Paris",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);

  const todayKey = dayKey(now);
  const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
  const tomorrowKey = dayKey(tomorrow);
  const kKey = dayKey(k);

  const hourFmt = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const hour = hourFmt.format(k).replace(":", "h");

  const dowFmt = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "long",
  });
  const dow = dowFmt.format(k);

  if (kKey === todayKey) {
    const parisHourNum = Number(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Paris",
        hour: "2-digit",
        hour12: false,
      })
        .format(k)
        .split(":")[0]
    );
    return parisHourNum >= 18 ? "ce soir" : `aujourd'hui ${hour}`;
  }
  if (kKey === tomorrowKey) return `demain ${hour}`;
  return `${dow} ${hour}`;
}
