import { fetchJson } from "../fetch.js";
import { getConfig } from "../config.js";

// balldontlie.io — free pour fixtures NBA, $9.99/mo pour advanced stats.
// Doc: https://docs.balldontlie.io
//
// Phase 1 : on fetch les games schedulés et les stats par game.

export type BdlGame = {
  id: number;
  date: string;                  // ISO
  status: string;                // 'Final' | 'date string for upcoming'
  home_team: { id: number; abbreviation: string; full_name: string };
  visitor_team: { id: number; abbreviation: string; full_name: string };
  home_team_score: number;
  visitor_team_score: number;
};

export async function fetchUpcomingGames(daysAhead = 7): Promise<BdlGame[]> {
  const cfg = getConfig();
  const start = new Date();
  const end = new Date(Date.now() + daysAhead * 86400_000);
  const url = new URL("https://api.balldontlie.io/v1/games");
  url.searchParams.set("start_date", start.toISOString().slice(0, 10));
  url.searchParams.set("end_date", end.toISOString().slice(0, 10));
  url.searchParams.set("per_page", "100");

  const headers: Record<string, string> = {};
  if (cfg.BALLDONTLIE_API_KEY) headers["Authorization"] = cfg.BALLDONTLIE_API_KEY;

  const json = await fetchJson<{ data: BdlGame[] }>(url.toString(), { headers, perHostConcurrency: 1 });
  return json.data;
}
