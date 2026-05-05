// Coach personalities — copied from app/_data/coaches.ts (the bot runs in isolation
// and cannot import from the Next.js app). Keep these in sync if the marketing copy
// of the personalities evolves.

export type CoachId = "leo" | "jack" | "paco" | "tony" | "hans";

export type Coach = {
  id: CoachId;
  name: string;
  league: string;
  flag: string;
  vibe: string;
  bio: string;
  signature: string;
  color: string;
};

export const COACHES: Record<CoachId, Coach> = {
  leo: {
    id: "leo",
    name: "Dembefric",
    league: "Ligue 1",
    flag: "🇫🇷",
    color: "#1B6B3A",
    vibe: "Le gamin qui regarde tous les matchs au bar du coin avec ses potes.",
    bio: "Il connaît la rotation de Luis Enrique avant que TF1 en parle. Il a vu chaque but de Ligue 1 cette saison. Il te dit qui joue, qui est cuit, et où mettre ta thune.",
    signature: "Mbappé titu ce soir, j'te jure. La conf de presse a tout dit.",
  },
  jack: {
    id: "jack",
    name: "Mo Sawin",
    league: "Premier League",
    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    color: "#1E2A4D",
    vibe: "Londonien, dry humour, jamais surpris. Te sort une stat avant que tu finisses ta phrase.",
    bio: "Il a Opta et StatsBomb dans la tête. Il te raconte pourquoi City sans Rodri n'est plus la même équipe en 30 secondes. Pas de blabla, que des chiffres qui parlent.",
    signature: "City sans Rodri = -47% de pressing efficace. Just maths, mate.",
  },
  paco: {
    id: "paco",
    name: "Belligagne",
    league: "La Liga",
    flag: "🇪🇸",
    color: "#C0392B",
    vibe: "Madrilène passionné, dramatique, raconte chaque Clásico comme un film d'Almodóvar.",
    bio: "Il a grandi avec le Bernabéu en bruit de fond. Il sent les momentums, les rivalités cachées. Il combine le feeling old-school avec la donnée chiffrée.",
    signature: "El Clásico se gana en el medio. Ce soir, c'est moi le boss du milieu.",
  },
  tony: {
    id: "tony",
    name: "Vlachance",
    league: "Serie A",
    flag: "🇮🇹",
    color: "#0F66B0",
    vibe: "Posé, regard de tactician, parle catenaccio et 3-5-2 comme tu respires.",
    bio: "Il dessine les lignes défensives avant chaque match. Il sait quel coach va sortir le bus, quel attaquant verra 4 ballons. Pour les value bets sur les +/− buts, c'est lui ton mec.",
    signature: "Difesa alta de l'Inter ce soir. Value sur le buteur en seconde période.",
  },
  hans: {
    id: "hans",
    name: "Kagnotte",
    league: "Bundesliga",
    flag: "🇩🇪",
    color: "#71717b",
    vibe: "Précis comme un train allemand, mais sait rigoler. Obsédé par les xG et la régression.",
    bio: "Il calcule les écarts entre xG produits et buts marqués pour repérer les équipes en surperformance. Quand un attaquant marque 3 buts au-dessus de son xG, il sait qu'il va régresser. C'est mathématique.",
    signature: "Leverkusen 2.4 xG en moyenne à domicile. Read between the goals.",
  },
};

export const COACH_IDS: CoachId[] = ["leo", "jack", "paco", "tony", "hans"];

export function isCoachId(v: unknown): v is CoachId {
  return typeof v === "string" && v in COACHES;
}

export function findCoachByName(input: string): Coach | null {
  const norm = input.trim().toLowerCase();
  for (const c of Object.values(COACHES)) {
    if (c.name.toLowerCase() === norm || c.id === norm) return c;
  }
  return null;
}
