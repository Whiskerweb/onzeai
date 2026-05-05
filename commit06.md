# Commit 06 — Agents sport-spécialisés (foot, basket, tennis, UFC)

## Pourquoi

Pivot d'Onze.ai de foot-only vers multi-sport (foot / basket / tennis / UFC).
Les coachs Dembefric, Curritique, Federace, McTriple existent déjà dans
`coaches.ts` mais étaient *vides* : pas d'ingestion temps-réel, pas de stats,
pas de modèle. Cette release pose la fondation : 1 agent autonome par sport
qui ingère ses propres données, applique la méthodologie d'un parieur sharp,
et pousse les paris value-détectés via le pipeline Telegram existant.

## Ce qui est livré

### Skill méthodologique (Claude Code)
- **`~/.claude/skills/sports-bettor-pro/SKILL.md`** — codes du métier (CLV,
  EV+, devigging, Kelly, units, lingo FR+EN, archetypes, red flags des fake
  bettors, edges par sport). Source de vérité pour la voix et la discipline
  des agents. ~3.7k mots, frontmatter <1024 chars.

### Migrations Supabase
- **`supabase/migrations/0003_sport_pivot_remap.sql`** — patch du remap des
  anciens coach_ids (leo, jack, paco, tony, hans → foot). Le bulk UPDATE
  initial collisionnait sur la PK `(user_id, coach_id)` quand un user avait
  2 anciens IDs ou déjà `foot` + ancien. Réécrit en pattern UPSERT-puis-DELETE.
  Idempotent.
- **`supabase/migrations/0004_knowledge_base.sql`** — extension `vector` +
  12 tables alimentées par les agents : `sports`, `leagues`, `teams`,
  `players`, `fixtures`, `odds_snapshots`, `stats_team`, `stats_player`,
  `news_items` (avec `embedding vector(1536)`), `injuries`, `agent_runs`,
  `analyses`. RLS enabled, no policies (service-role-only, pattern existant).
  Seed des 4 sports.

### Workspace `agents/`
Nouveau workspace Node sibling de `bot/`, qui tournera sur la VM GCP
`bot.akyra.io`. Stack : Node 22 ESM, TypeScript strict, `@anthropic-ai/sdk`,
`@supabase/supabase-js`, `openai` (embeddings), `zod`, `pino`, `cheerio`,
`csv-parse`, `p-limit`.

```
agents/
├── package.json + tsconfig.json + .env.example
├── sports-bettor-pro.md           ← copie du skill, lu en system prompt
├── src/
│   ├── shared/                    config (zod env), supabase, llm (Anthropic
│   │                              + cache_control), embed (OpenAI 1536d),
│   │                              push-pick (POST /api/picks), devig
│   │                              (multiplicatif + power method), fetch
│   │                              (retry + per-host concurrency), runs
│   │                              (withRun ↔ agent_runs), types (zod
│   │                              AnalysisOutput).
│   ├── shared/sources/            wrappers data : oddsapi (the-odds-api +
│   │                              discovery dynamique), footballdata,
│   │                              understat, rss, balldontlie,
│   │                              tennisabstract (Sackmann CSVs), ufcstats,
│   │                              fbref (stub phase 2).
│   ├── ingest/{foot,basket,tennis,ufc}.ts
│   ├── analyze/{foot,basket,tennis,ufc}.ts (+ <sport>.addon.ts)
│   └── jobs/{ingest,analyze}.ts   CLI --sport <id> [--fixture-id <uuid>]
```

Chaque pipeline analyse :
1. SELECT fixtures next 48h (72h pour UFC) non-déjà-analysés
2. Build context bundle (stats, odds_snapshots, news, injuries, recent fixtures)
3. Call Claude Haiku 4.5 (par défaut) avec `sports-bettor-pro.md` + addon
   spécifique au sport, output JSON strict (schéma `AnalysisOutput`)
4. INSERT `analyses` systématiquement (audit complet, push *et* pass)
5. Si `decision='push'` && `edge_pct >= MIN_EDGE_PCT` && cap journalier non
   atteint → POST `/api/picks` (existant) → Supabase webhook → bot/broadcast
   → Telegram (pipeline 100% inchangé)

### Sources data par sport (free tier)

| Sport | Sources |
|---|---|
| **foot** | football-data.org (fixtures top-5 + UCL/UEL), the-odds-api (`soccer_*`), Understat (xG last5/season), RSS L'Équipe + BBC Sport |
| **basket** | balldontlie.io (NBA fixtures + form), the-odds-api (`basketball_nba`/`basketball_euroleague`), RSS ESPN NBA + BBC Basketball |
| **tennis** | the-odds-api avec discovery auto des `tennis_atp_*` / `tennis_wta_*` actifs, RSS ATP Tour + WTA. Joueurs stockés dans `teams` (1 row/joueur), `home_team_id` = player_a |
| **ufc** | the-odds-api `mma_mixed_martial_arts`, RSS MMA Junkie + Bloody Elbow. Fighters stockés dans `teams` |

### Documentation
- **`CLAUDE.md`** mis à jour : pivot multi-sport (4 coachs au lieu de 5),
  table des coach_ids actuels (foot/basket/tennis/ufc), section complète
  "Agents sport-spécialisés" (architecture, pipeline, statut, env vars,
  commandes), tables knowledge documentées, do-nots étendus.

## Statut technique

- ✅ `tsc --noEmit` passe sur les 4 pipelines (mode strict + `noUncheckedIndexedAccess`)
- ✅ `tsc` build OK → `dist/` complet
- ✅ Smoke test CLI : env validation throws proprement avec liste des vars manquantes
- ✅ Migrations 0003 + 0004 appliquées sur remote Supabase (le 2026-05-05)
- ⚠️ Pipeline pas encore testé end-to-end (besoin de remplir `agents/.env`)
- ⚠️ Déploiement VM GCP + 8 systemd timers = phase suivante

## Hors scope (phase suivante)

- **Test live des 4 pipelines** : remplir `agents/.env` (ANTHROPIC, OPENAI,
  ODDS_API, FOOTBALL_DATA en prio), lancer `npx tsx --env-file=.env
  src/jobs/{ingest,analyze}.ts --sport foot` avec `DRY_RUN=1` pendant 2-3
  jours pour observer la distribution `analyses.decision`, puis bascule en
  `DRY_RUN=0`.
- **Déploiement VM** : `git pull` + `npm ci` + `tsc` sur `/opt/onze-agents/`,
  8 systemd timers (4 ingest + 4 analyze) avec drop-ins de cadence par sport
  (foot 4h, basket 2h les jours de match, tennis 4h, UFC quotidien Mon-Fri
  + horaire les samedis d'event).
- **Chat RAG** : brancher `bot/src/handlers/chat.ts` sur `news_items.embedding`
  + injection des stats fraîches dans le system prompt des coachs. Pas dans
  ce commit (le user l'a explicitement repoussé).

## Notes opérationnelles

- **Cap journalier par défaut** : 2 picks/coach/jour (`PUSH_DAILY_CAP_PER_COACH`),
  donc max 8 picks/jour au total.
- **Edge minimum pour push** : 4% (`MIN_EDGE_PCT`), aligné avec la doctrine
  `ligue1-betting-expert`.
- **Coût LLM estimé** : Haiku 4.5 ≈ <$1/jour ; Sonnet 4.5 ≈ $5/jour si on
  upgrade après 1-2 semaines.
- **`agents/sports-bettor-pro.md` est une copie** du skill local. Si la
  méthodologie évolue, re-run :
  ```bash
  cp ~/.claude/skills/sports-bettor-pro/SKILL.md agents/sports-bettor-pro.md
  ```
