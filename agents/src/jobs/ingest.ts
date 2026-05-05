import { assertSport } from "../shared/config.js";
import { logger } from "../shared/logger.js";
import { ingestFoot } from "../ingest/foot.js";
import { ingestBasket } from "../ingest/basket.js";
import { ingestTennis } from "../ingest/tennis.js";
import { ingestUfc } from "../ingest/ufc.js";

// CLI entry pour l'ingestion. Appelé par systemd via :
//   node dist/jobs/ingest.js --sport foot
//
// Pas de --fixture-id (l'ingestion est always full-cycle pour le sport).

function arg(name: string): string | null {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return null;
  const v = process.argv[i + 1];
  return v && !v.startsWith("--") ? v : null;
}

async function main() {
  const sportRaw = arg("sport");
  if (!sportRaw) {
    console.error("Usage: ingest --sport foot|basket|tennis|ufc");
    process.exit(2);
  }
  const sport = assertSport(sportRaw);
  logger.info({ sport }, "ingest:start");

  switch (sport) {
    case "foot":
      await ingestFoot();
      break;
    case "basket":
      await ingestBasket();
      break;
    case "tennis":
      await ingestTennis();
      break;
    case "ufc":
      await ingestUfc();
      break;
  }

  logger.info({ sport }, "ingest:done");
}

main().catch((e) => {
  logger.error({ err: e instanceof Error ? `${e.message}\n${e.stack}` : String(e) }, "ingest:fatal");
  process.exit(1);
});
