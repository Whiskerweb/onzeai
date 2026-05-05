import type { LucideIcon } from "lucide-react";
import { Crown, Flame, Compass, BarChart3 } from "lucide-react";

export type CoachId = "foot" | "basket" | "tennis" | "ufc";

export type SportId = CoachId;

export type Capability = string;

export type Scenario = { q: string; a: string };

export type Coach = {
  id: CoachId;
  name: string;
  number: string;
  sport: string;
  competitions: string[];
  competitionsShort: string;
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
    id: "foot",
    name: "Dembefric",
    number: "07",
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
    city: "Paris",
    color: "#1B6B3A",
    Icon: Flame,
    vibe: "Le pote du bar qui mate L1, PL, Liga, Serie A et Bundesliga en parallèle, écran splitté.",
    bio: "Il connaît la rotation de Luis Enrique avant TF1. PSG, City, Real, Bayern, Inter, il a vu chaque match. Il bouffe les 5 grands championnats (L1, Premier League, La Liga, Serie A, Bundesliga), la Champions, l'Europa, et il bascule sur les sélections quand le Mondial ou l'Euro arrivent. Il te dit qui joue, qui est cuit, où poser ta thune.",
    signature: "Mbappé titu ce soir, j'te jure. La conf de presse a tout dit.",
    capabilities: [
      "Top-5 européen complet",
      "Champions + Europa League",
      "Sélections (Mondial, Euro)",
      "Compos & blessures J-1",
      "xG / Opta / forme",
    ],
    stats: { seasons: 12, matches: 4580, yield: "+8,4%" },
    sample: {
      time: "20:14",
      text: "PSG-OM ce soir. Marquinhos suspendu, Donnarumma fragile sur sa droite depuis 3 matchs. Je sens un >2.5 buts. Cote 1.78 sur Winamax, value claire.",
    },
    headline: "Toutes les ligues. Toutes les coupes. Un seul mec.",
    portrait: "/onze/coaches/dembefric.png",
  },
  {
    id: "basket",
    name: "Curritique",
    number: "30",
    sport: "Basket",
    competitions: ["NBA", "EuroLeague", "WNBA", "FIBA"],
    competitionsShort: "NBA, EuroLeague, WNBA, FIBA",
    flag: "🇺🇸",
    city: "Brooklyn",
    color: "#E08537",
    Icon: BarChart3,
    vibe: "Le mec qui se lève à 4h pour la game NBA et qui connaît le PER de chaque rookie.",
    bio: "NBA, EuroLeague, WNBA, FIBA. Il ouvre les box scores comme toi ton café. Il sait qui est en load management, qui revient de blessure, qui chauffe en back-to-back. Tu lui balances le matchup, il te sort le pari qui paye.",
    signature: "Wemby joue 32 minutes max contre les Lakers. Take the under, easy.",
    capabilities: [
      "NBA (saison + Playoffs + Finals)",
      "EuroLeague + Final Four",
      "WNBA + FIBA",
      "Matchups individuels",
      "PER / TS% / load management",
    ],
    stats: { seasons: 9, matches: 3120, yield: "+9,8%" },
    sample: {
      time: "21:42",
      text: "Lakers-Celtics ce soir, Doncic en repos (load management). Tatum +30 PTS sur ses 4 derniers contre LAL. Tatum >27.5 pts cote 1.92, je prends.",
    },
    headline: "Toute la planète basket. Stats à l'appui.",
  },
  {
    id: "tennis",
    name: "Federace",
    number: "20",
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
    city: "Bâle",
    color: "#C8DA3D",
    Icon: Compass,
    vibe: "Le mec qui suit le circuit ATP/WTA depuis 20 ans, terre, gazon, dur, indoor.",
    bio: "Les 4 Grand Chelems : Roland Garros, Wimbledon, US Open, Australian Open. Plus tous les Masters 1000 ATP et WTA. Il sait qui aime quelle surface, qui craque mentalement au tie-break du 5e, qui a bossé son service à l'inter-saison. Tu mises sans checker le H2H ? Tu mises mal.",
    signature: "Alcaraz sur ocre rapide à Madrid : 12-1 en carrière. Read the surface.",
    capabilities: [
      "Les 4 Grand Chelems",
      "ATP Masters 1000 + WTA 1000",
      "H2H par surface",
      "Forme 4 dernières semaines",
      "Mental sets serrés",
    ],
    stats: { seasons: 18, matches: 6240, yield: "+10,6%" },
    sample: {
      time: "14:08",
      text: "Sinner vs Medvedev demi Indian Wells. Sinner 5-0 sur dur depuis janvier, Medvedev 35% premières balles sur le tournoi. Sinner 2 sets, cote 2.30.",
    },
    headline: "Les 4 Slams. Les Masters. Toutes les surfaces.",
  },
  {
    id: "ufc",
    name: "McTriple",
    number: "01",
    sport: "UFC / MMA",
    competitions: ["UFC PPV", "UFC Fight Night", "Bellator", "PFL"],
    competitionsShort: "UFC PPV, UFC Fight Night, Bellator, PFL",
    flag: "🇮🇪",
    city: "Dublin",
    color: "#B62B2B",
    Icon: Crown,
    vibe: "Le pote qui regarde chaque pesée et qui sait qui a coupé 8 kilos de trop.",
    bio: "UFC PPV, UFC Fight Night, Bellator, PFL. Il connaît chaque card par cœur. Striker, grappler, allonge, cardio round 3, cuts violents. Tu paries un fight sans lui demander, tu paries en aveugle. Il te file le winner, le round, la méthode.",
    signature: "Volk fight au round 4 contre un grappler qui le tient pas. Locked in.",
    capabilities: [
      "UFC PPV (toutes les cards)",
      "UFC Fight Night",
      "Bellator + PFL",
      "Striker vs grappler",
      "Allonge / cardio / cuts",
    ],
    stats: { seasons: 13, matches: 1840, yield: "+12,4%" },
    sample: {
      time: "23:15",
      text: "UFC 314 ce soir. Volkanovski vs Topuria. Topuria 100% finitions au 1er round dans ses 3 derniers. Topuria KO/TKO round 1, cote 4.50. C'est sale.",
    },
    headline: "Toutes les cards UFC. Plus Bellator et PFL.",
  },
];
