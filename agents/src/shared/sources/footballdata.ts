import { fetchJson } from "../fetch.js";
import { getConfig } from "../config.js";

// football-data.org v4 — free 10 req/min, 100 req/jour. Suffisant pour 1 req/ligue/jour.
// Doc: https://www.football-data.org/documentation/quickstart

export const FD_COMPETITIONS = {
  l1: "FL1",
  pl: "PL",
  liga: "PD",       // Primera División
  serie_a: "SA",
  bundesliga: "BL1",
  champions_league: "CL",
  europa_league: "EL",
} as const;

export type FdMatch = {
  id: number;
  competition: { id: number; name: string; code: string };
  utcDate: string;
  status: string;          // SCHEDULED | LIVE | FINISHED | POSTPONED | ...
  matchday: number | null;
  homeTeam: { id: number; name: string; shortName: string | null; tla: string | null };
  awayTeam: { id: number; name: string; shortName: string | null; tla: string | null };
  score: {
    fullTime: { home: number | null; away: number | null };
    halfTime: { home: number | null; away: number | null };
  };
};

export type FdMatchesResponse = {
  count: number;
  filters: Record<string, string>;
  matches: FdMatch[];
};

export async function fetchScheduledMatches(competitionCode: string): Promise<FdMatch[]> {
  const cfg = getConfig();
  if (!cfg.FOOTBALL_DATA_TOKEN) throw new Error("FOOTBALL_DATA_TOKEN missing in env");
  const url = `https://api.football-data.org/v4/competitions/${competitionCode}/matches?status=SCHEDULED`;
  const json = await fetchJson<FdMatchesResponse>(url, {
    headers: { "X-Auth-Token": cfg.FOOTBALL_DATA_TOKEN },
    perHostConcurrency: 1,            // 10 req/min hard cap → on serializa
  });
  return json.matches;
}
