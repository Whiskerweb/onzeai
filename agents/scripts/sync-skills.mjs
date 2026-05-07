#!/usr/bin/env node
// Sync skills coach : ~/.claude/skills/<coach>/SKILL.md → agents/skills/<coach>.md
// Source de vérité = ~/.claude/skills/. Les copies dans agents/ sont chargées au runtime
// par agents/src/shared/llm.ts (loadCoachSkill). Pre-commit hook check pour anti-drift.
//
// Usage :
//   node scripts/sync-skills.mjs            # copy
//   node scripts/sync-skills.mjs --check    # exit 1 if drift (CI / pre-commit)

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const HERE = dirname(fileURLToPath(import.meta.url));
const AGENTS_ROOT = join(HERE, "..");
const SKILLS_HOME = join(homedir(), ".claude", "skills");
const SKILLS_DIR = join(AGENTS_ROOT, "skills");

const COACHES = [
  { id: "dembefric-foot",      sport: "foot" },
  { id: "curritique-basket",   sport: "basket" },
  { id: "federace-tennis",     sport: "tennis" },
  { id: "mctriple-ufc",        sport: "ufc" },
  // Skill commun référencé par les coach skills (structure fiche analysis_card).
  { id: "football-pronostics", sport: null },
];

const checkMode = process.argv.includes("--check");

function sha(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

function bannerFor(coach) {
  return `<!-- SOURCE: ~/.claude/skills/${coach.id}/SKILL.md — DO NOT EDIT THIS COPY. Edit source then run \`npm run sync-skills\`. -->\n`;
}

if (!existsSync(SKILLS_DIR)) mkdirSync(SKILLS_DIR, { recursive: true });

let drift = 0;
let synced = 0;
let missing = 0;

for (const coach of COACHES) {
  const src = join(SKILLS_HOME, coach.id, "SKILL.md");
  const dst = join(SKILLS_DIR, `${coach.id}.md`);

  if (!existsSync(src)) {
    console.warn(`[skip] no source for ${coach.id} (sport=${coach.sport}) at ${src}`);
    missing++;
    continue;
  }

  const srcContent = readFileSync(src, "utf8");
  const expected = bannerFor(coach) + srcContent;
  const expectedSha = sha(expected);

  if (existsSync(dst)) {
    const actual = readFileSync(dst, "utf8");
    if (sha(actual) === expectedSha) {
      console.log(`[ok]   ${coach.id}.md in sync`);
      continue;
    }
    if (checkMode) {
      console.error(`[drift] ${coach.id}.md differs from source`);
      drift++;
      continue;
    }
  }

  if (checkMode) {
    console.error(`[missing-or-drift] ${coach.id}.md`);
    drift++;
    continue;
  }

  writeFileSync(dst, expected, "utf8");
  console.log(`[sync] ${coach.id}.md ← ~/.claude/skills/${coach.id}/SKILL.md (${srcContent.length} chars)`);
  synced++;
}

if (checkMode && drift > 0) {
  console.error(`\n${drift} skill(s) drifted. Run: npm run sync-skills`);
  process.exit(1);
}

console.log(`\nDone. synced=${synced} missing=${missing} drift=${drift}`);
