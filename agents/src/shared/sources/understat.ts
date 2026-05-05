import { fetchText } from "../fetch.js";

// Understat — free, no key. Données xG / shots embarquées comme JSON dans le HTML.
// Pour la phase pilote on se contente du "season teams" : xG/xGA agrégés par équipe.
// Doc non-officielle : la donnée est dans <script> JSON.parse('<encoded>').

export type UndTeam = {
  id: string;
  title: string;
  history: Array<{
    h_a: "h" | "a";
    xG: string;          // strings dans le HTML
    xGA: string;
    npxG: string;
    npxGA: string;
    ppda: { att: number; def: number };
    pts: number;
    date: string;
  }>;
};

const LEAGUE_SLUG = {
  l1: "Ligue_1",
  pl: "EPL",
  liga: "La_liga",
  serie_a: "Serie_A",
  bundesliga: "Bundesliga",
} as const;

export async function fetchSeasonTeamStats(
  league: keyof typeof LEAGUE_SLUG,
  year: number,
): Promise<UndTeam[]> {
  const slug = LEAGUE_SLUG[league];
  const html = await fetchText(`https://understat.com/league/${slug}/${year}`, { perHostConcurrency: 1 });
  // Le payload est : <script>... var teamsData = JSON.parse('\\x7b...\\x7d'); ...</script>
  const match = html.match(/teamsData\s*=\s*JSON\.parse\('([^']+)'\)/);
  if (!match) throw new Error("Understat: teamsData payload not found in HTML");
  const decoded = decodeUnicodeEscapes(match[1]!);
  return JSON.parse(decoded) as UndTeam[];
}

function decodeUnicodeEscapes(s: string): string {
  // Understat échappe en \xHH. JSON.parse ne le fait pas, donc on remplace manuellement.
  return s.replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/** Helper : xG cumulé d'une équipe sur les N derniers matchs. */
export function lastNxG(team: UndTeam, n = 5): { xG: number; xGA: number; matches: number } {
  const tail = team.history.slice(-n);
  return {
    xG: tail.reduce((a, h) => a + parseFloat(h.xG), 0),
    xGA: tail.reduce((a, h) => a + parseFloat(h.xGA), 0),
    matches: tail.length,
  };
}
