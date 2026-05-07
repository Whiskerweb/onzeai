@AGENTS.md

# Onze.ai (akyra.io)

SaaS de pronostics multi-sport (foot, basket, tennis, UFC) avec 4 coachs IA, un
par sport. L'user paye un abonnement Stripe (Solo / Squad / All Access), reçoit
les paris sur Telegram via @OnziaBot, et peut chatter avec ses coachs (3/20/∞
messages chat par jour selon le plan).

## Coach IDs (routing par sport)

| id | persona | sport | flag |
|---|---|---|---|
| `foot` | Dembefric | Football (top-5 europe + UCL/UEL) | ⚽ |
| `basket` | Curritique | Basketball (NBA + EuroLeague) | 🏀 |
| `tennis` | Federace | Tennis (ATP + WTA) | 🎾 |
| `ufc` | McTriple | MMA / UFC | 🥊 |

Source de vérité côté web : `app/_data/coaches.ts`.
Copie côté bot (pour les system prompts) : `bot/src/lib/coaches.ts` — garder en sync.

> **Note historique** : avant le pivot multi-sport (migration `0003_sport_pivot_remap.sql`),
> les 5 anciens coachs foot (`leo`, `jack`, `paco`, `tony`, `hans`) ont été remappés vers
> le seul `foot`. La migration est idempotente.

## Architecture

```
Next.js 16 web (Vercel @ akyra.io)              Bot (GCP @ bot.akyra.io)
─────────────────────────────────              ────────────────────────────
/start  (onboarding wizard)                     POST /webhook/<secret>  (Telegram)
/start/success (post-Stripe → magic link)       POST /broadcast         (Supabase webhook)
/upgrade (magic-link plan/coach change)         GET  /health
/api/checkout  /api/upgrade  /api/picks         Grammy + Hono server, systemd service
/api/stripe/webhook                             Caddy reverse proxy (Let's Encrypt auto)
/api/cron/lifecycle (Vercel cron daily)
                       │                                        │
                       ▼                                        ▼
                   ┌──────────────────────────────────────────────┐
                   │   Supabase (project thcwlydkvkbahospltoo)    │
                   │   public.users, .auth_tokens, .user_coaches, │
                   │   .picks, .pick_deliveries, .chat_messages   │
                   │   Database Webhook on picks INSERT → bot     │
                   └──────────────────────────────────────────────┘
                                      │
                                      ▼
                                 OpenRouter (chat only — Gemma)
```

## Comment Lucas demande un pari (la chose principale qu'on fait ici)

Lucas dit : « pousse un pari Dembefric sur PSG-OM, [bet], cote X, [why] ».
Je traduis et lance :

```bash
npx tsx --env-file=.env.local scripts/push-pick.ts \
  --coach <foot|basket|tennis|ufc> \
  --pick "<bet text>" \
  --cote <number, optionnel> \
  --fixture "<id, optionnel>" \
  --reasoning "<why, optionnel>"
```

> **Préfère le pipeline agents** (`/agents/`) si la donnée temps-réel est ingérée :
> `cd agents && npx tsx --env-file=.env src/jobs/analyze.ts --sport foot`. Le
> push manuel ci-dessus reste valide pour les paris que tu décides hors-pipeline
> (intuition, info privée, scénario que le modèle ne voit pas).

Effet : INSERT dans `public.picks` → Database Webhook Supabase → bot `/broadcast`
→ message Telegram **uniquement** aux users dont `user_coaches.coach_id` matche
le coach et dont `subscription_status IN ('trialing','active')` et `telegram_id IS NOT NULL`.

Pour vérifier la livraison :
```sql
select pd.delivered_at, u.email, u.telegram_username, pd.error
from public.pick_deliveries pd
join public.users u on u.id = pd.user_id
where pick_id = '<id>';
```

Endpoint HTTP alternatif (automation externe) : `POST /api/picks` avec header
`x-picks-secret: <PICKS_INGEST_SECRET>` et body JSON même shape.

## Séparation des rôles : Claude vs Gemma

- **Claude Opus (Claude Code via abo Max)** = source des paris officiels.
  Le pipeline `agents/src/jobs/analyze.ts` invoke `claude -p` en headless sur la
  VM (auth via abo Max Lucas, login 1×). Inclus dans abo, pas de facturation
  token. Skills coach (`~/.claude/skills/dembefric-foot/` etc.) sont auto-
  découverts. Push manuel possible aussi via `scripts/push-pick.ts`.
- **Backend alternatif API** : si tu set `ANTHROPIC_API_KEY` et `LLM_BACKEND=api`,
  le pipeline utilise le SDK Anthropic à la place du CLI (facturé au token,
  cache_control ephemeral dispo, recommandé pour scale > 1k users).
- **Gemma (OpenRouter, dans le bot)** = chat conversationnel. Discute des paris
  déjà partagés, NE propose JAMAIS de nouveau ticket. Si l'user demande un pari
  dans le chat, Gemma redirige : « Mes paris officiels arrivent en push ». Voir
  le system prompt dans `bot/src/lib/prompt.ts`.

## Cycle de vie d'un user

1. **Onboarding** : `/start?plan=…` → wizard plan + coachs → `/api/checkout` → Stripe
   Checkout (CB upfront, trial 7j) → `/start/success` crée user + auth_token (purpose
   'claim') → redirect `t.me/OnziaBot?start=<token>` → bot lie le `telegram_id`.
2. **Trial 7j** : status `trialing`, paris reçus, chat actif.
3. **D+7** : Stripe charge la CB.
   - Succès → status `active`, on continue.
   - Échec → status `past_due`. Bot envoie un message warning, mais accès maintenu.
4. **D+9 (= D+2 grace)** : `/api/cron/lifecycle` (Vercel daily 01:00 UTC) cancel le
   Stripe sub, set `subscription_status='terminated'`, `locked_at=now()`, envoie un
   message Telegram d'au revoir. Bot rejette ensuite tous les messages.
5. **D+39** : hard delete (CASCADE sur user_coaches, chat_messages, etc.).

## Upgrade plan / coach swap

User tape `/upgrade` dans le bot → bot génère un token (purpose 'upgrade'), envoie
un magic link `https://akyra.io/upgrade?token=…` (30 min). Page web charge le wizard
pré-rempli avec les coachs actuels (« Déjà suivi »), user choisit nouveau plan +
nouveau set, soumet → `/api/upgrade` appelle `stripe.subscriptions.update` avec
`proration_behavior='create_prorations'` puis reconcile `user_coaches`.

## Rate limit bot

`bot/src/lib/ratelimit.ts` :
- Anti-burst : max 1 message user / 2s par `telegram_id` (sinon réponse "Doucement").
- Concurrence LLM : max 1 appel Gemma in-flight par user (sinon "J'écris déjà…").
- In-memory Maps avec GC. OK car bot tourne sur 1 VM unique.
- Quota chat journalier : 3 (Solo) / 20 (Squad) / ∞ (All) via `bot/src/lib/quota.ts`.

## Deployment

### Web (Vercel @ akyra.io)
- Push sur `main` → auto-deploy.
- Env vars dans Vercel Settings (voir `.env.local` pour la liste).
- Cron Vercel déclaré dans `vercel.json` (path `/api/cron/lifecycle`, daily 01:00 UTC).

### Bot (GCP Compute Engine @ bot.akyra.io)
- Project : `trac-486223`, zone `europe-west9-a`, instance `onze-bot`.
- IP statique : `34.155.108.184` (réservée comme `onze-bot-ip`).
- DNS : `bot.akyra.io` → `34.155.108.184` (record A, proxy OFF).
- Code : `/opt/onze-bot` sur la VM, déployé via git clone + `npx tsc`.
- Process : systemd unit `onze-bot.service` (auto-restart, run user `lucasroncey`).
- HTTPS : Caddy (`/etc/caddy/Caddyfile`, cert Let's Encrypt auto).

Commandes utiles :
```bash
# SSH
gcloud compute ssh onze-bot --zone=europe-west9-a

# Logs en direct
gcloud compute ssh onze-bot --zone=europe-west9-a \
  --command="sudo journalctl -u onze-bot -f"

# Re-deploy après modif sur main
gcloud compute ssh onze-bot --zone=europe-west9-a --command="
  cd /tmp/onzeai && git pull --depth 1 origin main &&
  cp -r /tmp/onzeai/bot/. /opt/onze-bot/ &&
  cd /opt/onze-bot && npm ci --omit=dev && npx tsc &&
  sudo systemctl restart onze-bot
"

# Status
gcloud compute ssh onze-bot --zone=europe-west9-a \
  --command="sudo systemctl status onze-bot caddy"
```

## Tables Supabase (project `thcwlydkvkbahospltoo`)

### Tables produit (existantes)

| Table | Rôle |
|-------|------|
| `users` | identité, plan, status, telegram_id, stripe_*, locked_at |
| `auth_tokens` | tokens magic-link onboarding ('claim') et upgrade ('upgrade') |
| `user_coaches` | M2M user × coach (filtre du fan-out) |
| `picks` | paris (INSERT déclenche le webhook → fan-out) |
| `pick_deliveries` | tracking par-user (telegram_message_id, error) |
| `chat_messages` | historique chat (user_id, coach_id, role, content) |

### Knowledge base (migration 0004, alimentée par les agents)

| Table | Rôle |
|---|---|
| `sports` | référentiel des 4 sports (`foot`,`basket`,`tennis`,`ufc`) |
| `leagues` | ligues / compétitions (L1, NBA, ATP, UFC, …), avec `ext_ids` jsonb |
| `teams` | équipes — résolues par nom dans une ligue, `ext_ids` pour cross-API |
| `players` | joueurs (utile pour stats player + injuries) |
| `fixtures` | matches programmés / live / finis ; clé soft = `ext_ids->>provider` |
| `odds_snapshots` | timeline des cotes (par book, market, side, line) — append-only |
| `stats_team` | stats équipe (xG, ORtg, ELO, …) timeline |
| `stats_player` | stats joueur (PRA, 1st-serve %, ko_rate, …) timeline |
| `news_items` | articles RSS / scrapes, avec `embedding vector(1536)` pour future RAG chat |
| `injuries` | blessures actives par joueur |
| `agent_runs` | trace des cycles ingest/analyze (success/error, métriques) |
| `analyses` | output Claude par fixture (decision push/pass/watch + reasoning), back-ref `pick_id` |

RLS activée sur tout, policies = aucune (service-role-only).

## Agents sport-spécialisés (`/agents/`)

Workspace Node séparé qui tourne sur la VM GCP `bot.akyra.io` à côté du bot.

```
/agents/
├── package.json                tsx + @anthropic-ai/sdk + @supabase/supabase-js + openai (embeddings)
├── tsconfig.json               ESM, NodeNext, strict, build vers dist/
├── sports-bettor-pro.md        COPIE de ~/.claude/skills/sports-bettor-pro/SKILL.md
│                               (system prompt méthodologique de l'analyse)
├── src/
│   ├── shared/                 helpers communs
│   │   ├── config.ts           env via zod ; SPORTS = ['foot','basket','tennis','ufc']
│   │   ├── supabase.ts         client service-role
│   │   ├── llm.ts              Anthropic SDK + cache_control sur le system prompt
│   │   ├── embed.ts            OpenAI text-embedding-3-small (1536d)
│   │   ├── push-pick.ts        POST /api/picks (réutilise le pipeline existant)
│   │   ├── devig.ts            multiplicatif + power method
│   │   ├── fetch.ts            fetch + retry + per-host concurrency (p-limit)
│   │   ├── runs.ts             withRun() ↔ public.agent_runs
│   │   ├── types.ts            schéma zod AnalysisOutput (validation LLM)
│   │   └── sources/            wrappers data : oddsapi, footballdata, understat,
│   │                           rss, balldontlie, tennisabstract, ufcstats, fbref(stub)
│   ├── ingest/{foot,basket,tennis,ufc}.ts    pipeline d'ingestion par sport
│   ├── analyze/{foot,basket,tennis,ufc}.ts   pipeline d'analyse par sport
│   ├── analyze/foot.addon.ts                 add-on system prompt foot-spécifique
│   └── jobs/{ingest,analyze}.ts              CLI entry points (--sport, --fixture-id)
└── systemd/                                  templates pour la VM (à créer phase deploy)
```

### Pipeline d'analyse (par sport)

```
ingest cron N h  → fetch fixtures + odds + stats + news → upsert knowledge DB
                                                                ↓
analyze cron M h → SELECT fixtures next 48h → build context bundle (stats/odds/news/injuries)
                  → call Claude (system: sports-bettor-pro.md + addon sport)
                  → output JSON (decision/edge/recommended_price/reasoning)
                  → INSERT public.analyses
                  → if decision='push' && edge>=MIN_EDGE_PCT && cap journalier non atteint:
                        POST /api/picks (existant) → Supabase webhook → bot/broadcast → Telegram
```

Source de vérité méthodologique : skill `~/.claude/skills/sports-bettor-pro/SKILL.md`.
La copie embarquée `agents/sports-bettor-pro.md` doit rester en sync :
```bash
cp ~/.claude/skills/sports-bettor-pro/SKILL.md agents/sports-bettor-pro.md
```

### Skills coach (cascade 4-layers)

Le system prompt envoyé à Claude Haiku/Sonnet est assemblé dans
`agents/src/shared/llm.ts:71` comme une cascade :

```
[sports-bettor-pro.md]   méthodo universelle (CLV/EV/Kelly/lingo/red flags)
    ↓
[<coach>.md]             persona coach + edges fine + few-shot
    ↓
[<sport>.addon.ts]       data hints DB (colonnes/jointures Supabase)
    ↓
[OUTPUT_SCHEMA_HINT]     contrat zod AnalysisOutput
```

Les 3 premières couches sont cachées (`cache_control: ephemeral`) — stables
inter-fixtures d'un même sport, donc 90% des input tokens sont en cache hit
après le 1er appel.

| Coach | Sport | Source skill | Copie embarquée | Statut |
|---|---|---|---|---|
| Dembefric | foot | `~/.claude/skills/dembefric-foot/SKILL.md` | `agents/skills/dembefric-foot.md` | ✅ écrit |
| Curritique | basket | `~/.claude/skills/curritique-basket/SKILL.md` | `agents/skills/curritique-basket.md` | ✅ écrit |
| Federace | tennis | `~/.claude/skills/federace-tennis/SKILL.md` | `agents/skills/federace-tennis.md` | ✅ écrit |
| McTriple | ufc | `~/.claude/skills/mctriple-ufc/SKILL.md` | `agents/skills/mctriple-ufc.md` | ✅ écrit |

Si la copie d'un skill coach est absente (commits 2/3/4 pas faits), `loadCoachSkill()`
retourne `""` + log warn et la cascade tourne sans le layer 2 — le sport
fonctionne avec global skill + addon TS seuls (comportement antérieur).

#### Sync workflow

```bash
# Édit du skill source
$EDITOR ~/.claude/skills/dembefric-foot/SKILL.md

# Re-sync vers agents/
cd agents && npm run sync-skills

# Vérifier (CI / pre-commit)
cd agents && npm run sync-skills:check
```

Le pre-commit hook bloque le commit si drift détecté.

#### Telemetry skills (migration 0005)

`supabase/migrations/0005_skill_coach_telemetry.sql` ajoute :
- Colonnes `analyses.dry_run`, `closing_price`, `closing_book`, `clv_pp`,
  `result`, `settled_at`, `coach_voice_compliant`, `sanity_check_passed`.
- Table `backtest_runs` : variants A/B pour mesurer effet skill avant rollout.
- Vue `agent_performance` : agrégat hebdo par sport (pushes, avg_edge, avg_clv,
  roi_unit, hit_rate).

Jobs associés :

```bash
# Backtest A/B avant rollout d'un skill coach
cd agents && npx tsx --env-file=.env src/jobs/backtest-skill.ts --sport foot --n 30

# Daily : compute CLV pour les analyses push dont la fixture est finished
cd agents && npx tsx --env-file=.env src/jobs/compute-clv.ts
```

Critère go skill rollout : variant B (avec skill) − variant A (sans) ≥ +0.5pp
de CLV simulé sur 30 fixtures.

#### Ordre des commits skill (rollout coach par coach)

| Phase | Coach | Validation requise avant phase suivante |
|---|---|---|
| 1 (en cours) | Dembefric foot | backtest CLV ≥ +0.5pp + 7j shadow DRY_RUN=1 OK |
| 2 | Curritique basket | idem |
| 3 | Federace tennis | idem |
| 4 | McTriple ufc | idem |

Foot d'abord car volume picks max → N=30 atteint en ~5 sem, signal stat le
plus rapide. Si phase 1 fail au backtest, on itère le skill Dembefric avant
de répliquer le template aux 3 autres.

### Status (2026-05-05)

- ✅ Migrations `0003_sport_pivot_remap.sql` + `0004_knowledge_base.sql` appliquées remote
- ✅ Workspace `agents/` scaffolded, typecheck + build OK
- ✅ **4 pipelines complets** (ingest + analyze + addon par sport) :
  - **foot** : football-data.org + the-odds-api + Understat (xG) + RSS L'Équipe/BBC
  - **basket** : balldontlie (NBA fixtures) + the-odds-api (NBA + EuroLeague) + RSS ESPN/BBC
  - **tennis** : the-odds-api avec discovery dynamique des tournois actifs + RSS ATP/WTA
  - **ufc** : the-odds-api `mma_mixed_martial_arts` + RSS MMA Junkie/Bloody Elbow
- ⚠️ Pipeline pas encore testé end-to-end (besoin `agents/.env`) — task #11
- ⚠️ Déploiement VM + systemd timers = non fait — task #13

### Commandes utiles

```bash
# Setup
cd agents && cp .env.example .env  # remplir les clés
npm install

# Dev (depuis la racine du repo, après .env rempli)
cd agents && npx tsx --env-file=.env src/jobs/ingest.ts --sport foot
cd agents && DRY_RUN=1 npx tsx --env-file=.env src/jobs/analyze.ts --sport foot
cd agents && npx tsx --env-file=.env src/jobs/analyze.ts --sport foot --fixture-id <uuid>

# Build
cd agents && npx tsc

# Smoke test (doit échouer proprement avec liste des env manquants)
cd agents && node dist/jobs/ingest.js --sport foot
```

### Variables d'environnement (`agents/.env`)

```
SUPABASE_URL                       # https://thcwlydkvkbahospltoo.supabase.co
SUPABASE_SERVICE_ROLE_KEY          # service_role key
PICKS_INGEST_URL                   # https://akyra.io/api/picks
PICKS_INGEST_SECRET                # secret partagé avec /api/picks
ANTHROPIC_API_KEY                  # clé Anthropic API (Claude Haiku 4.5 par défaut)
ANALYZE_MODEL                      # claude-haiku-4-5 | claude-sonnet-4-5
OPENAI_API_KEY                     # pour embeddings text-embedding-3-small
ODDS_API_KEY                       # the-odds-api.com (free 500/mois)
FOOTBALL_DATA_TOKEN                # football-data.org (free 10/min)
BALLDONTLIE_API_KEY                # optionnel, balldontlie.io
DRY_RUN                            # 1 pour bloquer les pushes (analyse seule)
PUSH_DAILY_CAP_PER_COACH           # safety cap (défaut 2)
MIN_EDGE_PCT                       # gate min edge pour push (défaut 4)
```

## Don'ts

- ❌ Ne commit JAMAIS `.env.local` ou `bot/.env` (gitignored, mais double-check).
- ❌ Ne propose pas de nouveau pari dans Gemma (le system prompt l'interdit déjà).
- ❌ Ne bypass pas le filtre `coach_id` du fan-out — sinon tout le monde reçoit tout.
- ❌ Ne change pas le shape de `coaches.ts` côté web sans répercuter dans
  `bot/src/lib/coaches.ts`.
- ❌ Ne run pas `gcloud compute instances delete` ou `supabase db reset` sans
  confirmation explicite — destructif.
- ❌ Ne modifie pas `agents/sports-bettor-pro.md` directement — c'est une copie
  du skill local. Modifie `~/.claude/skills/sports-bettor-pro/SKILL.md` puis
  ré-exécute le `cp` documenté ci-dessus.
- ❌ Ne pousse pas un pick depuis l'agent sans avoir log la cote au moment du
  push (le pipeline le fait via `analyses.recommended_price`). Sans la cote
  prise on ne peut pas mesurer le CLV — la pipeline n'a plus aucune valeur.

## Documents complémentaires

- `SETUP.md` — walkthrough complet de la mise en route (Stripe, Telegram, Supabase webhook, Vercel, GCP)
- `bot/README.md` — focus déploiement bot (template Fly.io, encore valide pour repli)
- `AGENTS.md` — warning Next.js 16 breaking changes
