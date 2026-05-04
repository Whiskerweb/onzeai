import type { LucideIcon } from "lucide-react";
import { Trophy, Crown, Flame, Compass, BarChart3 } from "lucide-react";

export type CoachId = "leo" | "jack" | "paco" | "tony" | "hans";

export type Capability = string;

export type Scenario = { q: string; a: string };

export type Coach = {
  id: CoachId;
  name: string;
  number: string;
  league: string;
  flag: string;
  city: string;
  color: string;
  Icon: LucideIcon;
  vibe: string;
  bio: string;
  signature: string;
  capabilities: Capability[];
  stats: { seasons: number; matches: number; yield: string };
  sample: { time: string; text: string };
  headline: string;
  portrait?: string;
};

export const coaches: Coach[] = [
  {
    id: "leo",
    name: "Dembefric",
    number: "07",
    league: "Ligue 1",
    flag: "🇫🇷",
    city: "Paris",
    color: "#1B6B3A",
    Icon: Flame,
    vibe: "Le gamin qui regarde tous les matchs au bar du coin avec ses potes.",
    bio: "Il connaît la rotation de Luis Enrique avant que TF1 en parle. Il a vu chaque but de Ligue 1 cette saison. Il te dit qui joue, qui est cuit, et où mettre ta thune.",
    signature: "Mbappé titu ce soir, j'te jure. La conf de presse a tout dit.",
    capabilities: [
      "xG / Opta",
      "Compositions probables",
      "Forme à domicile",
      "Confs de presse",
      "Rumeurs vestiaire",
    ],
    stats: { seasons: 12, matches: 4580, yield: "+8,4%" },
    sample: {
      time: "20:14",
      text: "PSG-OM ce soir. Marquinhos out (suspendu), Donnarumma fragile sur sa droite depuis 3 matchs. Je sens un >2.5 buts. Cote 1.78 sur Winamax, value selon moi.",
    },
    headline: "Tu connais la Ligue 1. Dembefric la connaît mieux.",
    portrait: "/onze/coaches/dembefric.png",
  },
  {
    id: "jack",
    name: "Mo Sawin",
    number: "10",
    league: "Premier League",
    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    city: "Londres",
    color: "#1E2A4D",
    Icon: BarChart3,
    vibe: "Londonien, dry humour, jamais surpris. Te sort une stat avant que tu finisses ta phrase.",
    bio: "Il a Opta et StatsBomb dans la tête. Il te raconte pourquoi City sans Rodri n'est plus la même équipe en 30 secondes. Pas de blabla, que des chiffres qui parlent.",
    signature: "City sans Rodri = -47% de pressing efficace. Just maths, mate.",
    capabilities: [
      "xG cumulés",
      "Stats high press",
      "Rotation Europe",
      "Blessures J−1",
      "Set pieces",
    ],
    stats: { seasons: 15, matches: 5720, yield: "+11,2%" },
    sample: {
      time: "13:02",
      text: "Arsenal-Liverpool dimanche. Salah 0.6 xG/match en déplacement contre Big 6. Saka 1.1 xG sur les 5 derniers. Buteur Saka cote 2.85 — c'est cadeau.",
    },
    headline: "La Premier League par les chiffres. Pas par le hype.",
    portrait: "/onze/coaches/mosawin.png",
  },
  {
    id: "paco",
    name: "Belligagne",
    number: "21",
    league: "La Liga",
    flag: "🇪🇸",
    city: "Madrid",
    color: "#C0392B",
    Icon: Trophy,
    vibe: "Madrilène passionné, dramatique, raconte chaque Clásico comme un film d'Almodóvar.",
    bio: "Il a grandi avec le Bernabéu en bruit de fond. Il sent les momentums, les rivalités cachées. Il combine le feeling old-school avec la donnée chiffrée.",
    signature: "El Clásico se gana en el medio. Ce soir, c'est moi le boss du milieu.",
    capabilities: [
      "Tactique 4-3-3",
      "Rivalités locales",
      "Forme en Liga",
      "Coupes nationales",
      "Rotation Champions",
    ],
    stats: { seasons: 10, matches: 3880, yield: "+9,7%" },
    sample: {
      time: "19:48",
      text: "Real-Atletico samedi. Simeone joue toujours bas en derby (xGA 1.1 max). Anti-jeu garanti. Combi : moins de 2.5 buts + carton Carvajal, cote 4.20.",
    },
    headline: "La Liga, sa scène. Tes paris, son public.",
    portrait: "/onze/coaches/belligagne.png",
  },
  {
    id: "tony",
    name: "Vlachance",
    number: "06",
    league: "Serie A",
    flag: "🇮🇹",
    city: "Milan",
    color: "#0F66B0",
    Icon: Compass,
    vibe: "Posé, regard de tactician, parle catenaccio et 3-5-2 comme tu respires.",
    bio: "Il dessine les lignes défensives avant chaque match. Il sait quel coach va sortir le bus, quel attaquant verra 4 ballons. Pour les value bets sur les +/− buts, c'est lui ton mec.",
    signature: "Difesa alta de l'Inter ce soir. Value sur le buteur en seconde période.",
    capabilities: [
      "Schemas tactiques",
      "Stats défensives",
      "Rotation milieu",
      "Coupe d'Italie",
      "Penaltys clutch",
    ],
    stats: { seasons: 14, matches: 5120, yield: "+10,1%" },
    sample: {
      time: "18:30",
      text: "Inter-Juve. Inzaghi sort Bastoni (genou). Vlahovic en feu (3 buts en 4 matchs). Mes deux paris : but Vlahovic + corners >9.5. Combiné cote 3.40.",
    },
    headline: "Le calcio se joue lentement. Vlachance l'a déjà décodé.",
    portrait: "/onze/coaches/vlachance.png",
  },
  {
    id: "hans",
    name: "Kagnotte",
    number: "04",
    league: "Bundesliga",
    flag: "🇩🇪",
    city: "Munich",
    color: "#71717b",
    Icon: Crown,
    vibe: "Précis comme un train allemand, mais sait rigoler. Obsédé par les xG et la régression.",
    bio: "Il calcule les écarts entre xG produits et buts marqués pour repérer les équipes en surperformance. Quand un attaquant marque 3 buts au-dessus de son xG, il sait qu'il va régresser. C'est mathématique.",
    signature: "Leverkusen 2.4 xG en moyenne à domicile. Read between the goals.",
    capabilities: [
      "Modèles xG",
      "Régression à la moyenne",
      "Conditions météo",
      "Coachs jeunes",
      "Talents <21 ans",
    ],
    stats: { seasons: 11, matches: 3460, yield: "+12,3%" },
    sample: {
      time: "15:15",
      text: "Bayern-Dortmund. Kane à 0.9 buts au-dessus de son xG sur 5 matchs (régression imminente). Sané xA 1.4 — passeur décisif probable. Je joue passeur Sané, cote 5.50.",
    },
    headline: "La Bundesliga sous l'angle des chiffres qui ne mentent pas.",
    portrait: "/onze/coaches/kagnotte.png",
  },
];
