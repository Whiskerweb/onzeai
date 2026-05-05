import pino from "pino";
import { getConfig } from "./config.js";

export const logger = pino({
  level: getConfig().LOG_LEVEL,
  base: { app: "onze-agents" },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export function child(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}
