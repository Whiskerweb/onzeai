// Fixtures multi-sport (foot / basket / tennis / UFC).
// Affichées sur la home en preview gratuite (FreeMatchBanner / FreePickPopup).
// Pour rafraîchir : éditer ce fichier, ou plus tard brancher des APIs sport
// (football-data.org, balldontlie, ATP, ufcstats).

export type Fixture = {
  id: string;
  home: string;
  away: string;
  league: string; // nom long de la compétition (ex: "Ligue 1", "NBA Playoffs", "Roland Garros", "UFC 316")
  leagueShort: string; // forme courte (L1, NBA, RG26, UFC316)
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

const FOOT = {
  flag: "🇫🇷",
  coachId: "foot",
  coachName: "Dembefric",
  coachColor: "#1B6B3A",
};

const BASKET = {
  flag: "🇺🇸",
  coachId: "basket",
  coachName: "Curritique",
  coachColor: "#E08537",
};

const TENNIS = {
  flag: "🎾",
  coachId: "tennis",
  coachName: "Federace",
  coachColor: "#C8DA3D",
};

const UFC = {
  flag: "🥊",
  coachId: "ufc",
  coachName: "McTriple",
  coachColor: "#B62B2B",
};

export const fixtures: Fixture[] = [
  // ─────────── FOOT — Ligue 1 / Champions League ───────────
  {
    ...FOOT,
    league: "Ligue 1",
    leagueShort: "L1",
    id: "psg-brest-2026-05-10",
    home: "PSG",
    away: "Brest",
    kickoff: "21:00",
    kickoffISO: "2026-05-10T21:00:00+02:00",
    cote: "6.27",
    pick: "Combiné : PSG gagne + Doué buteur + plus de 2.5 buts",
    reasoning:
      "Luis Enrique fera tourner avant la finale UCL — Doué titulaire 100%. PSG marque dans 92% de ses matches au Parc. Brest fatigué (Europa en parallèle). Mise conseillée : 1% bankroll.",
    unlockedToday: 198,
  },
  {
    ...FOOT,
    league: "Champions League — Finale",
    leagueShort: "UCL",
    id: "ucl-final-2026-05-30",
    home: "PSG",
    away: "Real Madrid",
    kickoff: "21:00",
    kickoffISO: "2026-05-30T21:00:00+02:00",
    cote: "5.40",
    pick: "Combiné : Mbappé buteur ou passeur + plus de 2.5 buts",
    reasoning:
      "Première finale UCL pour PSG depuis 2020, Real cherche sa 16e. Mbappé impliqué sur 1.4 but/match en C1 cette saison. Match ouvert tactiquement (xG combiné > 3). Mise conseillée : 1% bankroll.",
    unlockedToday: 312,
  },

  // ─────────── BASKET — NBA Playoffs / EuroLeague ───────────
  {
    ...BASKET,
    league: "NBA — Conference Semifinals",
    leagueShort: "NBA",
    id: "lakers-celtics-2026-05-09",
    home: "Lakers",
    away: "Celtics",
    kickoff: "02:30",
    kickoffISO: "2026-05-09T02:30:00+02:00",
    cote: "1.92",
    pick: "Tatum > 27.5 points",
    reasoning:
      "Tatum +30 PTS sur ses 4 derniers contre LAL. Doncic load management probable (back-to-back). Match-up favorable contre la défense LAL en transition. Mise conseillée : 0.8% bankroll.",
    unlockedToday: 142,
  },
  {
    ...BASKET,
    league: "EuroLeague — Final Four",
    leagueShort: "EL F4",
    id: "panathinaikos-realmadrid-2026-05-22",
    home: "Panathinaikos",
    away: "Real Madrid",
    kickoff: "20:00",
    kickoffISO: "2026-05-22T20:00:00+02:00",
    cote: "3.10",
    pick: "Real Madrid gagne + écart < 8 pts",
    reasoning:
      "Real lourd côté banc (Hezonja, Tavares retour de blessure). Panathinaikos joue à domicile à Berlin avec un public 70% grec. Match serré jusqu'au quart-temps final. Mise conseillée : 0.7% bankroll.",
    unlockedToday: 56,
  },

  // ─────────── TENNIS — ATP / Roland Garros ───────────
  {
    ...TENNIS,
    league: "ATP Madrid — Finale",
    leagueShort: "ATP",
    id: "alcaraz-sinner-madrid-2026-05-10",
    home: "Alcaraz",
    away: "Sinner",
    kickoff: "16:30",
    kickoffISO: "2026-05-10T16:30:00+02:00",
    cote: "2.10",
    pick: "Alcaraz gagne en 3 sets",
    reasoning:
      "Alcaraz à domicile, 12-1 sur ocre rapide cette saison. Sinner pas dans son meilleur sur terre lente. Match accroché — H2H 5-4 Alcaraz. Set serré attendu. Mise conseillée : 0.9% bankroll.",
    unlockedToday: 87,
  },
  {
    ...TENNIS,
    league: "Roland Garros — 1er tour",
    leagueShort: "RG26",
    id: "djokovic-q1-2026-05-26",
    home: "Djokovic",
    away: "Qualifié",
    kickoff: "13:00",
    kickoffISO: "2026-05-26T13:00:00+02:00",
    cote: "1.45",
    pick: "Djokovic gagne 3-0",
    reasoning:
      "Djoko en finale d'ouverture facile contre un qualifié. Sa moyenne sets gagnés au 1er tour à RG : 6-2/6-3/6-2. Forme retrouvée après Madrid. Mise conseillée : 0.6% bankroll.",
    unlockedToday: 41,
  },

  // ─────────── UFC — PPV / Fight Night ───────────
  {
    ...UFC,
    league: "UFC 316 — Main Event",
    leagueShort: "UFC316",
    id: "topuria-volk-2026-05-17",
    home: "Topuria",
    away: "Volkanovski",
    kickoff: "05:00",
    kickoffISO: "2026-05-17T05:00:00+02:00",
    cote: "4.50",
    pick: "Topuria par KO/TKO round 1",
    reasoning:
      "Topuria 100% finitions au 1er round dans ses 3 derniers fights. Volk sort d'un KO violent à son dernier combat — chin question. Striker vs striker, Topuria a la puissance. Mise conseillée : 0.5% bankroll.",
    unlockedToday: 178,
  },
  {
    ...UFC,
    league: "UFC Fight Night",
    leagueShort: "UFC FN",
    id: "ufc-fn-2026-05-24",
    home: "Pereira",
    away: "Hill",
    kickoff: "04:00",
    kickoffISO: "2026-05-24T04:00:00+02:00",
    cote: "2.25",
    pick: "Pereira par KO/TKO en 2 rounds",
    reasoning:
      "Pereira striker pur, allonge +6cm. Hill cardio limité round 3 (statistique sur ses 5 derniers). Pereira touche tôt et finit avant le round 3 dans 80% de ses victoires. Mise conseillée : 0.7% bankroll.",
    unlockedToday: 94,
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
