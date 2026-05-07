# TODO Lucas — Mise en prod Onze.ai

État repo : `https://github.com/electron0o29-oss/onzeai` (private, 2 commits pushés)
Code complet : 4 skills coach + cascade pipeline + page web /picks/[id] + bot lien + telemetry + DRY_RUN + 9 systemd timers.

**6 étapes manuelles à faire dans cet ordre.** Chacune ~5-15 min.

---

## ÉTAPE 1 — Appliquer migrations Supabase (5 min)

**Quand** : maintenant, en premier (les 4 étapes suivantes en dépendent).

**But** : ajouter colonnes `dry_run`, `clv_pp`, `analysis_card`, vues `agent_performance` + `public_picks`.

**Action** :
1. Ouvre https://supabase.com/dashboard/project/thcwlydkvkbahospltoo/sql/new
2. Copie-colle contenu de `supabase/migrations/0005_skill_coach_telemetry.sql`, click **Run**
3. Refais avec `supabase/migrations/0006_analysis_card.sql`, click **Run**

**Vérifier** (dans le même SQL Editor) :
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name='analyses' AND column_name IN ('dry_run','analysis_card','clv_pp');
-- Doit retourner 3 rows.

SELECT table_name FROM information_schema.views
WHERE table_schema='public' AND table_name IN ('public_picks','agent_performance');
-- Doit retourner 2 rows.
```

---

## ÉTAPE 2 — Créer comptes 3 APIs data sources (15 min)

**Quand** : pendant que les migrations tournent.

**But** : récupérer 3 clés API gratuites pour ingest.

**Comptes à créer** :

| Service | URL | Clé renvoyée |
|---|---|---|
| **the-odds-api** | https://the-odds-api.com → "Get free API Key" → email confirm | `ODDS_API_KEY` (free 500 req/mois) |
| **football-data.org** | https://football-data.org/client/register → email | `FOOTBALL_DATA_TOKEN` (free 10/min) |
| **balldontlie.io** | https://balldontlie.io → register | `BALLDONTLIE_API_KEY` (free, optionnel pour basic NBA) |

Garde les 3 clés ouvertes pour étape 3.

---

## ÉTAPE 3 — Remplir `agents/.env` (5 min)

**Quand** : après étape 2.

**But** : configurer le pipeline pour qu'il puisse tourner.

**Action** :
```bash
cd ~/Downloads/onzeai-main\ 2/agents
cp .env.example .env
$EDITOR .env
```

**À remplir (5 vars + 1 optionnelle, mode CLI Claude Code via abo Max)** :

```env
# Supabase — Settings/API du dashboard
SUPABASE_URL=https://thcwlydkvkbahospltoo.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # service_role secret (pas anon !)

# Pousse de pick (même secret que sur Vercel /api/picks)
PICKS_INGEST_URL=https://akyra.io/api/picks
PICKS_INGEST_SECRET=...   # même valeur que la var Vercel PICKS_INGEST_SECRET

# LLM via Claude Code CLI (abo Max Lucas) — pas d'API key !
LLM_BACKEND=cli
# ANTHROPIC_API_KEY=        # vide en mode CLI
# OPENAI_API_KEY=           # optionnel, embeddings phase 2 RAG chat

# Data sources (étape 2)
ODDS_API_KEY=c1a8ed2ef9e7e329d8655c2e87c7f8db
FOOTBALL_DATA_TOKEN=12f07ddb11b746adb3f403ddd8c5beeb
BALLDONTLIE_API_KEY=c7b3769a-34d4-4825-99b9-1070a0701384

# Mode shadow ON par défaut → INSERT analyses mais skip pushPick
DRY_RUN=1
```

**Important : mode CLI requiert `claude` connecté sur la VM.**
Sur la VM (étape 5) :
```bash
gcloud compute ssh onze-bot --zone=europe-west9-a
# Puis sur la VM :
npm install -g @anthropic-ai/claude-code
claude login   # interactif : ouvre URL, tu valides avec ton compte Max
claude --version
```

**Tester en local** :
```bash
cd ~/Downloads/onzeai-main\ 2/agents
npm install
DRY_RUN=1 npx tsx --env-file=.env src/jobs/ingest.ts --sport foot
DRY_RUN=1 npx tsx --env-file=.env src/jobs/analyze.ts --sport foot
```

Doit tourner sans crash. Vérifie dans Supabase :
```sql
SELECT decision, COUNT(*), AVG(edge_pct) FROM analyses
WHERE sport_id='foot' AND created_at > now() - interval '1 hour'
GROUP BY decision;
```

---

## ÉTAPE 4 — Vercel deploy (5 min)

**Quand** : après étape 1 (migrations) pour que `public_picks` view existe.

**But** : déployer la nouvelle page `/picks/[id]` + dépendance `react-markdown`.

**Action — si Vercel déjà lié au GitHub** :
- Va sur https://vercel.com/dashboard → projet onzeai
- Si pas encore importé : "Import Project" → choisis `electron0o29-oss/onzeai`
- Configure les env vars Vercel (copies depuis ton `.env.local` actuel) :
  - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
  - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*`
  - `PICKS_INGEST_SECRET` (même valeur que dans agents/.env)
  - `BROADCAST_SHARED_SECRET` (même que côté bot)
  - `RESEND_API_KEY`, etc. selon ton setup actuel
- Build auto déclenché par push (déjà fait)

**Vérifier** :
```bash
# Page picks existe (404 sur ID bidon = OK, pas erreur 500)
curl -I https://akyra.io/picks/test-bidon-12345
```

---

## ÉTAPE 5 — VM bot : env var + redeploy + systemd timers (15 min)

**Quand** : après étape 4 (akyra.io déployé pour que les liens dans Telegram pointent vers les bonnes URL).

**But** : (a) ajouter `PUBLIC_SITE_URL` au bot pour les liens Telegram, (b) mettre à jour le code bot, (c) installer les 9 systemd timers pour les agents.

**Action — tout-en-un** :

```bash
# Étape 5a : update bot env + redeploy
gcloud compute ssh onze-bot --zone=europe-west9-a --command="
  sudo grep -q PUBLIC_SITE_URL /etc/systemd/system/onze-bot.service || \
    sudo sed -i '/Environment=BROADCAST_SHARED_SECRET=/a Environment=PUBLIC_SITE_URL=https://akyra.io' /etc/systemd/system/onze-bot.service

  cd /tmp/onzeai && git pull --depth 1 origin main 2>/dev/null || \
    git clone --depth 1 https://github.com/electron0o29-oss/onzeai.git /tmp/onzeai
  cd /tmp/onzeai && git pull --depth 1 origin main

  cp -r /tmp/onzeai/bot/. /opt/onze-bot/
  cd /opt/onze-bot && npm ci --omit=dev && npx tsc

  sudo systemctl daemon-reload
  sudo systemctl restart onze-bot
  sudo journalctl -u onze-bot -n 10 --no-pager
"
```

**Étape 5b : installer agents + systemd timers** :

```bash
gcloud compute ssh onze-bot --zone=europe-west9-a --command="
  # Crée /opt/onze-agents si pas déjà là
  sudo mkdir -p /opt/onze-agents
  sudo chown lucasroncey:lucasroncey /opt/onze-agents

  # Copie le code agents
  cp -r /tmp/onzeai/agents/. /opt/onze-agents/

  # Crée /opt/onze-agents/.env (copie depuis ton local)
  # ↑ FAIT-LE MANUELLEMENT : scp depuis ton mac, ou édite via vim sur la VM
  echo 'IMPORTANT: tu dois copier ton fichier agents/.env local dans /opt/onze-agents/.env'

  # Install deps + build
  cd /opt/onze-agents && npm ci && npx tsc
  chmod +x systemd/run.sh

  # Install systemd units
  sudo cp systemd/onze-agents@.service /etc/systemd/system/
  sudo cp systemd/onze-agents-*.timer /etc/systemd/system/
  sudo systemctl daemon-reload

  # Enable + démarre les 9 timers
  for t in ingest-foot analyze-foot ingest-basket analyze-basket ingest-tennis analyze-tennis ingest-ufc analyze-ufc compute-clv ; do
    sudo systemctl enable --now \"onze-agents-\$t.timer\"
  done

  # Vérifier
  sudo systemctl list-timers 'onze-agents-*'
"
```

**Copier `.env` sur la VM** :
```bash
# Depuis ton mac
scp ~/Downloads/onzeai-main\ 2/agents/.env onze-bot.europe-west9-a.trac-486223:/tmp/agents.env
gcloud compute ssh onze-bot --zone=europe-west9-a --command="
  sudo mv /tmp/agents.env /opt/onze-agents/.env
  sudo chown lucasroncey:lucasroncey /opt/onze-agents/.env
  sudo chmod 600 /opt/onze-agents/.env
"
```

---

## ÉTAPE 6 — Shadow run 7 jours (action passive)

**Quand** : aussitôt après étape 5 = automatique grâce aux systemd timers.

**But** : laisser tourner DRY_RUN=1 pendant 7 jours pour valider sans risque user.

**Pendant 7 jours** :
- Les timers tournent foot 4h, basket NBA-aware, tennis 4h, UFC Mon-Fri+samedi.
- Les `analyses` s'insèrent avec `dry_run=true`, MAIS aucun message Telegram envoyé.
- Le job daily `compute-clv` calcule le CLV à 02:00 UTC chaque jour.

**Surveille chaque jour** dans Supabase :

```sql
-- 1. Distribution decisions par sport (dois voir push/pass/watch ratios raisonnables)
SELECT sport_id, decision, COUNT(*),
       ROUND(AVG(edge_pct)::numeric, 2) AS avg_edge
FROM analyses
WHERE created_at > now() - interval '7 days' AND dry_run = true
GROUP BY sport_id, decision
ORDER BY sport_id, decision;

-- 2. Sanity (pas trop de push, edges raisonnables 4-15%)
-- Si push rate > 30% → skill trop laxiste, à durcir
-- Si push rate < 5% → skill trop strict, perd du volume

-- 3. Voix compliance
SELECT sport_id, COUNT(*) AS lock_violations FROM analyses
WHERE created_at > now() - interval '7 days'
  AND (reasoning_short ~* '\b(lock|banker|sure|100%|guaranteed)\b'
       OR pick_text ~* '\b(lock|banker)\b')
GROUP BY sport_id;
-- Attendu : 0 partout.

-- 4. CLV après 3-5 jours (fixtures terminées commencent à pricer)
SELECT * FROM agent_performance
WHERE week >= date_trunc('week', now() - interval '2 weeks')
ORDER BY sport_id, week DESC;
```

---

## ÉTAPE 7 — Go-live (~10 min)

**Quand** : après 7 jours de shadow concluant (push rate stable, voix compliant, CLV ≥ 0).

**Action** : retire `DRY_RUN=1` de `/opt/onze-agents/.env` sur la VM :

```bash
gcloud compute ssh onze-bot --zone=europe-west9-a --command="
  sudo sed -i '/^DRY_RUN=/d' /opt/onze-agents/.env
  echo 'DRY_RUN removed. Next analyze run = real push.'
"
```

Au prochain firing du timer analyze (≤ 4h), le premier vrai pick tombera sur Telegram avec le lien `/picks/<id>` cliquable.

**Force run immédiat (pour pas attendre le cron)** :
```bash
gcloud compute ssh onze-bot --zone=europe-west9-a --command="
  sudo systemctl start onze-agents@analyze-foot.service
"
```

---

## Récap timing

| # | Étape | Durée | Bloquant pour |
|---|---|---|---|
| 1 | Migrations Supabase | 5 min | Tout le reste |
| 2 | Créer 3 APIs free | 15 min | Étape 3 |
| 3 | Remplir agents/.env + test local | 10 min | Étapes 5-7 |
| 4 | Vercel deploy | 5 min | Étape 6 (sinon liens cassés) |
| 5 | VM bot env + agents + timers | 15 min | Étape 6 |
| 6 | Shadow 7j | passif | Étape 7 |
| 7 | Go-live | 5 min | — |

**Total actif : ~55 min de manip**, puis 7 jours d'attente passive, puis go-live.

---

## Si ça pète (debug)

**Pipeline crash** :
```bash
gcloud compute ssh onze-bot --zone=europe-west9-a --command="sudo journalctl -u 'onze-agents@*' -n 100 --no-pager"
```

**Skill trop laxiste** (trop de push) :
- Édite `~/.claude/skills/<coach>/SKILL.md` section caps
- `cd agents && npm run sync-skills`
- Push GitHub
- VM : `cd /tmp/onzeai && git pull && cp -r /tmp/onzeai/agents/. /opt/onze-agents/ && cd /opt/onze-agents && npx tsc`

**Bot ne forward pas** :
```bash
sudo journalctl -u onze-bot -n 50 --no-pager   # cherche "broadcast" errors
```

**Page /picks/[id] 500** :
- Vérifie que migration 0006 appliquée (vue `public_picks` doit exister)
- Vérifie env vars Vercel (`SUPABASE_SERVICE_ROLE_KEY`)

---

## Quand t'es prêt à passer aux autres sports

Skills déjà écrits pour Curritique/Federace/McTriple. Pour activer leur cron : ils sont DÉJÀ dans les timers (étape 5b). Mais tu peux les disable individuellement le temps de valider le ROI sport par sport :

```bash
# Désactive temporairement basket le temps de valider foot
sudo systemctl disable --now onze-agents-analyze-basket.timer

# Réactive quand foot validé
sudo systemctl enable --now onze-agents-analyze-basket.timer
```

Recommandation : valide foot d'abord (1-2 sem), puis active basket, puis tennis, puis UFC. 1 par 1 pour cap risque user et ROI tracking séparé.
