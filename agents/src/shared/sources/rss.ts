import { fetchText } from "../fetch.js";
import * as cheerio from "cheerio";

// Lecteur RSS générique. On extrait les <item> (RSS 2.0) avec title/link/description/pubDate.
// Robuste aux feeds Atom (basique) en repliant sur <entry>.

export type RssItem = {
  title: string;
  url: string;
  summary: string;
  publishedAt: Date | null;
  source: string;     // host, ou label fourni
};

export async function fetchRss(url: string, sourceLabel?: string): Promise<RssItem[]> {
  const xml = await fetchText(url, { perHostConcurrency: 2 });
  const $ = cheerio.load(xml, { xmlMode: true });
  const host = sourceLabel ?? new URL(url).host;

  const items: RssItem[] = [];

  // RSS 2.0
  $("item").each((_, el) => {
    const $el = $(el);
    const title = $el.find("title").first().text().trim();
    const link = $el.find("link").first().text().trim();
    const desc = stripHtml($el.find("description").first().text());
    const pub = $el.find("pubDate").first().text().trim();
    if (title && link) {
      items.push({
        title,
        url: link,
        summary: desc.slice(0, 800),
        publishedAt: pub ? new Date(pub) : null,
        source: host,
      });
    }
  });

  // Atom fallback
  if (items.length === 0) {
    $("entry").each((_, el) => {
      const $el = $(el);
      const title = $el.find("title").first().text().trim();
      const link = $el.find("link").first().attr("href") ?? "";
      const summary = stripHtml($el.find("summary").first().text() || $el.find("content").first().text());
      const pub = $el.find("updated").first().text().trim() || $el.find("published").first().text().trim();
      if (title && link) {
        items.push({
          title,
          url: link,
          summary: summary.slice(0, 800),
          publishedAt: pub ? new Date(pub) : null,
          source: host,
        });
      }
    });
  }

  return items;
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
