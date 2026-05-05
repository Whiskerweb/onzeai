import { fetchText } from "../fetch.js";
import * as cheerio from "cheerio";

// ufcstats.com — scrape officiel. Tolérant si rate-limit raisonnable (1 req/2s).
// On récupère les events à venir + cards, et les stats fighters par fight si dispo.

export type UfcEventListing = {
  name: string;
  url: string;
  date: Date | null;
};

export async function fetchUpcomingEvents(): Promise<UfcEventListing[]> {
  const html = await fetchText("http://ufcstats.com/statistics/events/upcoming", { perHostConcurrency: 1 });
  const $ = cheerio.load(html);
  const events: UfcEventListing[] = [];
  $("table tbody tr").each((_, tr) => {
    const $tr = $(tr);
    const a = $tr.find("a").first();
    const name = a.text().trim();
    const url = a.attr("href") ?? "";
    const dateText = $tr.find(".b-statistics__date").text().trim();
    const date = dateText ? new Date(dateText) : null;
    if (name && url) events.push({ name, url, date });
  });
  return events;
}

// Phase 1 : on s'arrête à la liste des events. Le détail card + stats sera implémenté
// quand le pipeline UFC passera de stub à pilote (task #12).
