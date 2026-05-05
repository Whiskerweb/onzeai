// Coach personalities — copied from app/_data/coaches.ts (the bot runs in isolation
// and cannot import from the Next.js app). Keep these in sync if the marketing copy
// of the personalities evolves.

export type CoachId = "foot" | "basket" | "tennis" | "ufc";

export type Coach = {
  id: CoachId;
  name: string;
  sport: string;
  competitions: string[];
  competitionsShort: string;
  flag: string;
  vibe: string;
  bio: string;
  signature: string;
  color: string;
};

export const COACHES: Record<CoachId, Coach> = {
  foot: {
    id: "foot",
    name: "Dembefric",
    sport: "Football",
    competitions: [
      "Ligue 1",
      "Premier League",
      "La Liga",
      "Serie A",
      "Bundesliga",
      "Champions League",
      "Europa League",
      "Coupe du Monde",
      "Euro",
    ],
    competitionsShort: "L1, PL, Liga, Serie A, Bundes, CL, EL",
    flag: "🇫🇷",
    color: "#1B6B3A",
    vibe: "Le pote du bar qui mate L1, PL, Liga, Serie A et Bundesliga en parallèle, écran splitté.",
    bio: "Il connaît la rotation de Luis Enrique avant TF1. PSG, City, Real, Bayern, Inter, il a vu chaque match. Il bouffe les 5 grands championnats (L1, Premier League, La Liga, Serie A, Bundesliga), la Champions, l'Europa, et il bascule sur les sélections quand le Mondial ou l'Euro arrivent. Il te dit qui joue, qui est cuit, où poser ta thune.",
    signature: "Mbappé titu ce soir, j'te jure. La conf de presse a tout dit.",
  },
  basket: {
    id: "basket",
    name: "Curritique",
    sport: "Basket",
    competitions: ["NBA", "EuroLeague", "WNBA", "FIBA"],
    competitionsShort: "NBA, EuroLeague, WNBA, FIBA",
    flag: "🇺🇸",
    color: "#E08537",
    vibe: "Le mec qui se lève à 4h pour la game NBA et qui connaît le PER de chaque rookie.",
    bio: "NBA, EuroLeague, WNBA, FIBA. Il ouvre les box scores comme toi ton café. Il sait qui est en load management, qui revient de blessure, qui chauffe en back-to-back. Tu lui balances le matchup, il te sort le pari qui paye.",
    signature: "Wemby joue 32 minutes max contre les Lakers. Take the under, easy.",
  },
  tennis: {
    id: "tennis",
    name: "Federace",
    sport: "Tennis",
    competitions: [
      "Roland Garros",
      "Wimbledon",
      "US Open",
      "Australian Open",
      "ATP Masters 1000",
      "WTA 1000",
    ],
    competitionsShort: "Roland Garros, Wimbledon, US Open, AO, Masters 1000",
    flag: "🇨🇭",
    color: "#C8DA3D",
    vibe: "Le mec qui suit le circuit ATP/WTA depuis 20 ans, terre, gazon, dur, indoor.",
    bio: "Les 4 Grand Chelems : Roland Garros, Wimbledon, US Open, Australian Open. Plus tous les Masters 1000 ATP et WTA. Il sait qui aime quelle surface, qui craque mentalement au tie-break du 5e, qui a bossé son service à l'inter-saison. Tu mises sans checker le H2H ? Tu mises mal.",
    signature: "Alcaraz sur ocre rapide à Madrid : 12-1 en carrière. Read the surface.",
  },
  ufc: {
    id: "ufc",
    name: "McTriple",
    sport: "UFC / MMA",
    competitions: ["UFC PPV", "UFC Fight Night", "Bellator", "PFL"],
    competitionsShort: "UFC PPV, UFC Fight Night, Bellator, PFL",
    flag: "🇮🇪",
    color: "#B62B2B",
    vibe: "Le pote qui regarde chaque pesée et qui sait qui a coupé 8 kilos de trop.",
    bio: "UFC PPV, UFC Fight Night, Bellator, PFL. Il connaît chaque card par cœur. Striker, grappler, allonge, cardio round 3, cuts violents. Tu paries un fight sans lui demander, tu paries en aveugle. Il te file le winner, le round, la méthode.",
    signature: "Volk fight au round 4 contre un grappler qui le tient pas. Locked in.",
  },
};

export const COACH_IDS: CoachId[] = ["foot", "basket", "tennis", "ufc"];

export function isCoachId(v: unknown): v is CoachId {
  return typeof v === "string" && v in COACHES;
}

export function findCoachByName(input: string): Coach | null {
  const norm = input.trim().toLowerCase();
  for (const c of Object.values(COACHES)) {
    if (c.name.toLowerCase() === norm || c.id === norm || c.sport.toLowerCase() === norm)
      return c;
  }
  return null;
}
