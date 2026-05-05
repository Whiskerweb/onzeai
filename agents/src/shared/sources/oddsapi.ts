import { fetchJson } from "../fetch.js";
import { getConfig } from "../config.js";

// the-odds-api.com — free 500 req/mois.
// Doc: https://the-odds-api.com/liveapi/guides/v4/
//
// Stratégie : 1 requête par "sport" couvre tous les events à venir avec markets choisis.
// On stocke chaque outcome dans odds_snapshots (book ='oddsapi:<bookmaker>' ou 'oddsapi_avg').

export type OddsApiOutcome = {
  name: string;     // 'Paris Saint Germain' | 'Draw' | 'Over' | 'fighter_a' | etc.
  price: number;    // décimale
  point?: number;   // line pour spreads / totals
};

export type OddsApiMarket = {
  key: string;      // 'h2h' | 'spreads' | 'totals'
  outcomes: OddsApiOutcome[];
};

export type OddsApiBookmaker = {
  key: string;      // 'pinnacle' | 'unibet_eu' | 'betclic' | ...
  title: string;
  last_update: string;
  markets: OddsApiMarket[];
};

export type OddsApiEvent = {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;     // ISO
  home_team: string;
  away_team: string;
  bookmakers: OddsApiBookmaker[];
};

// Mapping de nos sport_id internes vers les "sport_key" de the-odds-api.
// Pour foot/basket/ufc on hardcode. Pour tennis les keys sont tournoi-spécifiques
// (ex: tennis_atp_french_open) → on les découvre dynamiquement via fetchActiveSportKeys.
export const ODDS_API_KEYS = {
  foot: [
    "soccer_france_ligue_one",
    "soccer_epl",
    "soccer_spain_la_liga",
    "soccer_italy_serie_a",
    "soccer_germany_bundesliga",
    "soccer_uefa_champs_league",
    "soccer_uefa_europa_league",
  ],
  basket: ["basketball_nba", "basketball_euroleague"],
  ufc: ["mma_mixed_martial_arts"],
} as const;

export type OddsApiSport = {
  key: string;
  group: string;        // 'Soccer' | 'Tennis' | 'Basketball' | 'Mixed Martial Arts' | ...
  title: string;
  description: string;
  active: boolean;
  has_outrights: boolean;
};

/** Découverte dynamique des sport_keys actifs (tennis tournament-bound). */
export async function fetchActiveSportKeys(group: string): Promise<string[]> {
  const cfg = getConfig();
  if (!cfg.ODDS_API_KEY) throw new Error("ODDS_API_KEY missing in env");
  const url = new URL("https://api.the-odds-api.com/v4/sports");
  url.searchParams.set("apiKey", cfg.ODDS_API_KEY);
  url.searchParams.set("all", "false");          // active only
  const sports = await fetchJson<OddsApiSport[]>(url.toString(), { perHostConcurrency: 2 });
  return sports.filter((s) => s.group === group && s.active && !s.has_outrights).map((s) => s.key);
}

export async function fetchOddsForSportKey(
  sportKey: string,
  opts: { regions?: string; markets?: string } = {},
): Promise<OddsApiEvent[]> {
  const cfg = getConfig();
  if (!cfg.ODDS_API_KEY) throw new Error("ODDS_API_KEY missing in env");

  const regions = opts.regions ?? "eu,uk";
  const markets = opts.markets ?? "h2h,spreads,totals";
  const url = new URL(`https://api.the-odds-api.com/v4/sports/${sportKey}/odds`);
  url.searchParams.set("apiKey", cfg.ODDS_API_KEY);
  url.searchParams.set("regions", regions);
  url.searchParams.set("markets", markets);
  url.searchParams.set("oddsFormat", "decimal");
  url.searchParams.set("dateFormat", "iso");

  return fetchJson<OddsApiEvent[]>(url.toString(), { perHostConcurrency: 2 });
}

/** Average price across all bookmakers for a given (market, outcome). Used as fallback when Pinnacle absent. */
export function averagePrice(event: OddsApiEvent, marketKey: string, outcomeName: string, point?: number): number | null {
  const prices: number[] = [];
  for (const bm of event.bookmakers) {
    const m = bm.markets.find((mm) => mm.key === marketKey);
    if (!m) continue;
    const o = m.outcomes.find((oo) =>
      oo.name === outcomeName && (point === undefined || oo.point === point),
    );
    if (o) prices.push(o.price);
  }
  if (prices.length === 0) return null;
  return prices.reduce((a, b) => a + b, 0) / prices.length;
}

/** Pinnacle preferred, fallback to bookmaker average. */
export function bestSharpPrice(event: OddsApiEvent, marketKey: string, outcomeName: string, point?: number): { book: string; price: number } | null {
  const pin = event.bookmakers.find((bm) => bm.key === "pinnacle");
  if (pin) {
    const m = pin.markets.find((mm) => mm.key === marketKey);
    const o = m?.outcomes.find((oo) => oo.name === outcomeName && (point === undefined || oo.point === point));
    if (o) return { book: "pinnacle", price: o.price };
  }
  const avg = averagePrice(event, marketKey, outcomeName, point);
  if (avg === null) return null;
  return { book: "oddsapi_avg", price: avg };
}
