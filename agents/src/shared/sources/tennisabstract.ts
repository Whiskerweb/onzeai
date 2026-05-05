import { fetchText } from "../fetch.js";
import { parse } from "csv-parse/sync";

// Jeff Sackmann — open data ATP/WTA via GitHub raw CSVs.
// Repos : https://github.com/JeffSackmann/tennis_atp et /tennis_wta
//
// Phase 1 : on récupère le CSV des matchs de l'année courante (atp_matches_YYYY.csv) et l'ELO.
// Pour l'ELO, on utilise tennisabstract.com qui publie un classement régulièrement mis à jour.

const SACKMANN_ATP_BASE = "https://raw.githubusercontent.com/JeffSackmann/tennis_atp/master";
const SACKMANN_WTA_BASE = "https://raw.githubusercontent.com/JeffSackmann/tennis_wta/master";

export type TaMatch = {
  tourney_id: string;
  tourney_name: string;
  surface: string;             // Hard | Clay | Grass | Carpet
  tourney_date: string;        // YYYYMMDD
  match_num: string;
  winner_id: string;
  winner_name: string;
  loser_id: string;
  loser_name: string;
  score: string;
  best_of: string;
  round: string;
};

export async function fetchAtpMatches(year: number): Promise<TaMatch[]> {
  return fetchSackmannCsv(`${SACKMANN_ATP_BASE}/atp_matches_${year}.csv`);
}

export async function fetchWtaMatches(year: number): Promise<TaMatch[]> {
  return fetchSackmannCsv(`${SACKMANN_WTA_BASE}/wta_matches_${year}.csv`);
}

async function fetchSackmannCsv(url: string): Promise<TaMatch[]> {
  const csv = await fetchText(url, { perHostConcurrency: 1 });
  return parse(csv, { columns: true, skip_empty_lines: true }) as TaMatch[];
}
