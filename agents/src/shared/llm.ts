import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { spawn } from "node:child_process";
import { getConfig } from "./config.js";
import { logger } from "./logger.js";
import { AnalysisOutput } from "./types.js";

// 2 backends LLM possibles, sélection via env LLM_BACKEND :
//   - "api" (défaut si ANTHROPIC_API_KEY set) : SDK @anthropic-ai/sdk, facturé au token,
//     supporte cache_control ephemeral. Pour scaler > 1k users.
//   - "cli" (défaut si pas d'API key, auth via abo Max Lucas) : invoque `claude -p`
//     subprocess. Skills locaux auto-découverts (~/.claude/skills/). Inclus dans abo,
//     pas de facturation token. Recommandé pour MVP / shadow run.
//
// Auth requis pour CLI : sur la VM, run `claude login` 1× avec compte Lucas Max.

// ─── Skill loaders (identique pour les 2 backends) ─────────────────────

let bettorProCached: string | null = null;
function loadBettorPro(): string {
  if (bettorProCached) return bettorProCached;
  const here = dirname(fileURLToPath(import.meta.url));
  const path = join(here, "..", "..", "sports-bettor-pro.md");
  bettorProCached = readFileSync(path, "utf8");
  return bettorProCached;
}

const COACH_SKILL_FILES: Record<string, string> = {
  foot: "skills/dembefric-foot.md",
  basket: "skills/curritique-basket.md",
  tennis: "skills/federace-tennis.md",
  ufc: "skills/mctriple-ufc.md",
};
const COACH_SKILL_NAMES: Record<string, string> = {
  foot: "dembefric-foot",
  basket: "curritique-basket",
  tennis: "federace-tennis",
  ufc: "mctriple-ufc",
};
const coachSkillCache = new Map<string, string>();
function loadCoachSkill(sport: string): string {
  if (coachSkillCache.has(sport)) return coachSkillCache.get(sport)!;
  const rel = COACH_SKILL_FILES[sport];
  if (!rel) {
    coachSkillCache.set(sport, "");
    return "";
  }
  const here = dirname(fileURLToPath(import.meta.url));
  const path = join(here, "..", "..", rel);
  try {
    const txt = readFileSync(path, "utf8");
    coachSkillCache.set(sport, txt);
    return txt;
  } catch {
    logger.warn({ sport, path }, "llm:coach_skill_missing");
    coachSkillCache.set(sport, "");
    return "";
  }
}

export type AnalyzeInput = {
  sport: "foot" | "basket" | "tennis" | "ufc";
  sportAddon: string;
  contextJson: unknown;
  disableCoachSkill?: boolean;
};

export type AnalyzeResult = {
  output: AnalysisOutput;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
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
  "reasoning_long": "Argumentation détaillée, qui se permet stats/edge/CLV/sample size.",
  "analysis_card": "(SI decision='push' UNIQUEMENT) Fiche markdown 10 sections — voix coach. Sinon null."
}

Règles dures :
- decision='push' UNIQUEMENT si edge_pct >= 4 ET tu peux justifier le edge avec p_model et p_fair.
- decision='watch' si tu vois un edge léger (<4%) ou besoin de plus d'odds.
- Sinon decision='pass'.
- pick_text doit être en français, pousser dans la voix d'un parieur pro (jamais "lock" / "banker" / "100%").
- Si tu n'as pas la donnée pour une clé numérique, mets null. Ne fabrique pas de chiffres.
- analysis_card REQUIS si decision='push'. Suit la structure 10 sections détaillée dans le skill coach. Voix du coach. Markdown valide.
- analysis_card omis (null) si decision='pass' ou 'watch'.
`.trim();

// ─── Dispatcher ────────────────────────────────────────────────────────

export async function analyzeFixture(input: AnalyzeInput): Promise<AnalyzeResult> {
  const cfg = getConfig();
  const backend = pickBackend(cfg);
  if (backend === "cli") return analyzeViaCli(input);
  return analyzeViaApi(input);
}

function pickBackend(cfg: ReturnType<typeof getConfig>): "api" | "cli" {
  if (cfg.LLM_BACKEND === "api" || cfg.LLM_BACKEND === "cli") return cfg.LLM_BACKEND;
  // Auto : si pas de clé API → CLI (abo Max).
  if (!cfg.ANTHROPIC_API_KEY) return "cli";
  return "api";
}

// ─── Backend API (SDK Anthropic, facturé au token) ─────────────────────

async function analyzeViaApi(input: AnalyzeInput): Promise<AnalyzeResult> {
  const cfg = getConfig();
  if (!cfg.ANTHROPIC_API_KEY) {
    throw new Error("LLM_BACKEND=api but ANTHROPIC_API_KEY missing in env");
  }
  // Import dynamique : évite de charger le SDK quand on est en backend CLI.
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const a = new Anthropic({ apiKey: cfg.ANTHROPIC_API_KEY });

  const coachSkill = input.disableCoachSkill ? "" : loadCoachSkill(input.sport);
  const system =
    `${loadBettorPro()}\n\n---\n\n` +
    (coachSkill ? `${coachSkill}\n\n---\n\n` : "") +
    `${input.sportAddon}\n\n---\n\n` +
    OUTPUT_SCHEMA_HINT;

  const userMsg = `Voici le bundle de contexte pour ce fixture (JSON brut). Applique la méthodologie sports-bettor-pro + skill coach et retourne le JSON d'analyse.\n\n${JSON.stringify(input.contextJson, null, 2)}`;

  logger.debug({ model: cfg.ANALYZE_MODEL, contextChars: userMsg.length, backend: "api" }, "analyze:call");

  const resp = await a.messages.create({
    model: cfg.ANALYZE_MODEL,
    max_tokens: 4000,
    temperature: 0.4,
    system: [
      { type: "text", text: system, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: userMsg }],
  });

  const text =
    resp.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim() || "";

  const parsed = parseAnalysisJson(text);

  const usage = resp.usage as {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number | null;
    cache_read_input_tokens?: number | null;
  };

  return {
    output: parsed,
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    cacheCreationTokens: usage.cache_creation_input_tokens ?? 0,
    cacheReadTokens: usage.cache_read_input_tokens ?? 0,
    model: cfg.ANALYZE_MODEL,
  };
}

// ─── Backend CLI (claude headless, abo Max) ────────────────────────────

async function analyzeViaCli(input: AnalyzeInput): Promise<AnalyzeResult> {
  const cfg = getConfig();
  const skillName = input.disableCoachSkill ? null : COACH_SKILL_NAMES[input.sport];

  // En CLI, les skills sont auto-découverts depuis ~/.claude/skills/. On instruit
  // Claude Code de charger les bons skills, puis on lui passe le bundle JSON.
  // Le sportAddon (data hints DB) est concaténé au prompt user.
  const skillInstructions = skillName
    ? `Charge les skills "sports-bettor-pro" et "${skillName}" et "football-pronostics" pour cette tâche.`
    : `Charge le skill "sports-bettor-pro" pour cette tâche.`;

  const prompt = [
    skillInstructions,
    "",
    "Tu es un agent d'analyse pari sportif. Voici le bundle de contexte pour un fixture :",
    "",
    "```json",
    JSON.stringify(input.contextJson, null, 2),
    "```",
    "",
    "Hints data DB (addon TS) :",
    input.sportAddon,
    "",
    OUTPUT_SCHEMA_HINT,
    "",
    "RÉPONDS EXCLUSIVEMENT EN JSON VALIDE QUI MATCHE LE SCHÉMA. Pas de prose, pas de fence ```. Juste l'objet JSON brut.",
  ].join("\n");

  logger.debug({ promptChars: prompt.length, backend: "cli", skill: skillName }, "analyze:call");

  const text = await execClaudeCli(prompt, cfg.CLAUDE_CLI_PATH ?? "claude");
  const parsed = parseAnalysisJson(text);

  return {
    output: parsed,
    // CLI ne retourne pas la usage tokens en mode -p sans format json. On met 0 par défaut.
    inputTokens: 0,
    outputTokens: 0,
    cacheCreationTokens: 0,
    cacheReadTokens: 0,
    model: "claude-code-cli",
  };
}

function execClaudeCli(prompt: string, claudeBin: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(claudeBin, ["-p", "--output-format", "text"], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d: Buffer) => {
      stdout += d.toString("utf8");
    });
    proc.stderr.on("data", (d: Buffer) => {
      stderr += d.toString("utf8");
    });

    proc.on("error", (err) => {
      reject(new Error(`claude CLI spawn error: ${err.message}`));
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`claude CLI exited ${code}: ${stderr.slice(0, 500)}`));
        return;
      }
      resolve(stdout.trim());
    });

    proc.stdin.write(prompt);
    proc.stdin.end();
  });
}

// ─── JSON parsing tolérant ─────────────────────────────────────────────

function parseAnalysisJson(text: string): AnalysisOutput {
  const json = extractFirstJson(text);
  const parsed = AnalysisOutput.safeParse(json);
  if (!parsed.success) {
    logger.error({ raw: text.slice(0, 1000), issues: parsed.error.issues }, "analyze:invalid_output");
    throw new Error("LLM output failed AnalysisOutput schema");
  }
  return parsed.data;
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
