import { assertSport } from "../shared/config.js";
import { logger } from "../shared/logger.js";
import { analyzeFoot } from "../analyze/foot.js";
import { analyzeBasket } from "../analyze/basket.js";
import { analyzeTennis } from "../analyze/tennis.js";
import { analyzeUfc } from "../analyze/ufc.js";

// CLI entry pour l'analyse + push. Appelé par systemd via :
//   node dist/jobs/analyze.js --sport foot
//
// Optionnel : --fixture-id <uuid> pour ne traiter qu'un seul fixture (test pilote).

function arg(name: string): string | null {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return null;
  const v = process.argv[i + 1];
  return v && !v.startsWith("--") ? v : null;
}

async function main() {
  const sportRaw = arg("sport");
  if (!sportRaw) {
    console.error("Usage: analyze --sport foot|basket|tennis|ufc [--fixture-id <uuid>]");
    process.exit(2);
  }
  const sport = assertSport(sportRaw);
  const fixtureId = arg("fixture-id") ?? undefined;
  logger.info({ sport, fixtureId, dryRun: process.env.DRY_RUN === "1" }, "analyze:start");

  switch (sport) {
    case "foot":
      await analyzeFoot({ fixtureId });
      break;
    case "basket":
      await analyzeBasket({ fixtureId });
      break;
    case "tennis":
      await analyzeTennis({ fixtureId });
      break;
    case "ufc":
      await analyzeUfc({ fixtureId });
      break;
  }

  logger.info({ sport }, "analyze:done");
}

main().catch((e) => {
  logger.error({ err: e instanceof Error ? `${e.message}\n${e.stack}` : String(e) }, "analyze:fatal");
  process.exit(1);
});
