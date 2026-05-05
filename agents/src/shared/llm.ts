import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getConfig } from "./config.js";
import { logger } from "./logger.js";
import { AnalysisOutput } from "./types.js";

let cached: Anthropic | null = null;
function client(): Anthropic {
  if (cached) return cached;
  cached = new Anthropic({ apiKey: getConfig().ANTHROPIC_API_KEY });
  return cached;
}

// Le skill sports-bettor-pro est embarqué comme system prompt. Source de vérité :
// ~/.claude/skills/sports-bettor-pro/SKILL.md → cp vers agents/sports-bettor-pro.md.
let bettorProCached: string | null = null;
function loadBettorPro(): string {
  if (bettorProCached) return bettorProCached;
  // __dirname-equivalent ESM
  const here = dirname(fileURLToPath(import.meta.url));
  // src/shared/llm.ts → ../../sports-bettor-pro.md (en dev tsx) ; en build, dist/shared/llm.js → ../../sports-bettor-pro.md
  const path = join(here, "..", "..", "sports-bettor-pro.md");
  bettorProCached = readFileSync(path, "utf8");
  return bettorProCached;
}

export type AnalyzeInput = {
  sportAddon: string;          // bloc spécifique foot/basket/tennis/ufc (modèle attendu, ligne de marché, etc.)
  contextJson: unknown;         // bundle de stats/odds/news/injuries en JSON
};

export type AnalyzeResult = {
  output: AnalysisOutput;
  inputTokens: number;
  outputTokens: number;
  model: string;
};

const OUTPUT_SCHEMA_HINT = `
Tu DOIS répondre exclusivement en JSON valide qui matche EXACTEMENT ce schéma (pas de prose, pas de fence \`\`\`) :

{
  "decision": "push" | "pass" | "watch",
  "market": "1x2"|"ah"|"ou"|"btts"|"ml"|"spread"|"method"|"total"|null,
  "side":   "home"|"away"|"draw"|"over"|"under"|"fighter_a"|"fighter_b"|"ko"|"sub"|"dec"|null,
  "line": -1.5 | 2.75 | null,
  "recommended_price": 1.92 | null,
  "p_model": 0.55 | null,
  "p_fair":  0.51 | null,
  "edge_pct": 4.0 | null,
  "expected_clv_pp": 1.0 | null,
  "pick_text": "PSG -1 (handicap asiatique), cote 1.92",
  "reasoning_short": "1-2 phrases voix sharp, sans 'lock' ni hype.",
  "reasoning_long": "Argumentation détaillée, qui se permet stats/edge/CLV/sample size."
}

Règles dures :
- decision='push' UNIQUEMENT si edge_pct >= 4 ET tu peux justifier le edge avec p_model et p_fair.
- decision='watch' si tu vois un edge léger (<4%) ou besoin de plus d'odds.
- Sinon decision='pass'.
- pick_text doit être en français, pousser dans la voix d'un parieur pro (jamais "lock" / "banker" / "100%").
- Si tu n'as pas la donnée pour une clé numérique, mets null. Ne fabrique pas de chiffres.
`.trim();

export async function analyzeFixture(input: AnalyzeInput): Promise<AnalyzeResult> {
  const cfg = getConfig();
  const a = client();

  const system = `${loadBettorPro()}\n\n---\n\n${input.sportAddon}\n\n---\n\n${OUTPUT_SCHEMA_HINT}`;

  const userMsg = `Voici le bundle de contexte pour ce fixture (JSON brut). Applique la méthodologie sports-bettor-pro et retourne le JSON d'analyse.\n\n${JSON.stringify(input.contextJson, null, 2)}`;

  logger.debug({ model: cfg.ANALYZE_MODEL, contextChars: userMsg.length }, "analyze:call");

  const resp = await a.messages.create({
    model: cfg.ANALYZE_MODEL,
    max_tokens: 1500,
    temperature: 0.4,
    system: [
      // Cache le system prompt — il est stable entre fixtures et coûteux (skill + addon).
      { type: "text", text: system, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: userMsg }],
  });

  const text =
    resp.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim() || "";

  // Tolérance : Claude met parfois des fences ou de la prose autour. On extrait le premier objet JSON.
  const json = extractFirstJson(text);
  const parsed = AnalysisOutput.safeParse(json);
  if (!parsed.success) {
    logger.error({ raw: text, issues: parsed.error.issues }, "analyze:invalid_output");
    throw new Error("LLM output failed AnalysisOutput schema");
  }

  return {
    output: parsed.data,
    inputTokens: resp.usage.input_tokens,
    outputTokens: resp.usage.output_tokens,
    model: cfg.ANALYZE_MODEL,
  };
}

function extractFirstJson(text: string): unknown {
  const t = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  if (t.startsWith("{")) {
    try {
      return JSON.parse(t);
    } catch {
      // fallback à la regex brace match
    }
  }
  const match = t.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("LLM output did not contain a JSON object");
  return JSON.parse(match[0]);
}
