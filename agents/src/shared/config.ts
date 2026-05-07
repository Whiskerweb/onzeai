import { z } from "zod";

const Env = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),

  PICKS_INGEST_URL: z.string().url(),
  PICKS_INGEST_SECRET: z.string().min(8),

  // ANTHROPIC_API_KEY optionnel : si absent, le backend bascule en CLI (claude code via abo Max)
  ANTHROPIC_API_KEY: z.string().optional(),
  ANALYZE_MODEL: z.string().default("claude-haiku-4-5"),
  LLM_BACKEND: z.enum(["api", "cli", "auto"]).default("auto"),
  CLAUDE_CLI_PATH: z.string().optional(),  // override path vers le binaire claude (default: PATH lookup)

  OPENAI_API_KEY: z.string().optional(),
  EMBED_MODEL: z.string().default("text-embedding-3-small"),

  ODDS_API_KEY: z.string().optional(),
  FOOTBALL_DATA_TOKEN: z.string().optional(),
  BALLDONTLIE_API_KEY: z.string().optional(),

  DRY_RUN: z.string().default("0").transform((v) => v === "1" || v.toLowerCase() === "true"),
  PUSH_DAILY_CAP_PER_COACH: z.string().default("2").transform((v) => Number(v)),
  MIN_EDGE_PCT: z.string().default("4").transform((v) => Number(v)),
  LOG_LEVEL: z.string().default("info"),
});

export type Config = z.infer<typeof Env>;

let cached: Config | null = null;

export function getConfig(): Config {
  if (cached) return cached;
  const parsed = Env.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment:\n${issues}\n\nCopy agents/.env.example to agents/.env and fill in.`);
  }
  cached = parsed.data;
  return cached;
}

export const SPORTS = ["foot", "basket", "tennis", "ufc"] as const;
export type SportId = (typeof SPORTS)[number];

export function assertSport(s: string): SportId {
  if (!(SPORTS as readonly string[]).includes(s)) {
    throw new Error(`Unknown sport "${s}". Must be one of: ${SPORTS.join(", ")}`);
  }
  return s as SportId;
}
