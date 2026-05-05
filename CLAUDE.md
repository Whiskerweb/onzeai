@AGENTS.md

# Onze.ai (akyra.io)

SaaS de pronostics foot avec 5 coachs IA (un par top-5 championnat européen).
L'user paye un abonnement Stripe (Solo / Squad / All Access), reçoit les paris
sur Telegram via @OnziaBot, et peut chatter avec ses coachs (3/20/∞ messages
chat par jour selon le plan).

## Coach IDs (routing par championnat)

| id | persona | championnat | flag |
|------|------------|-----------------|------|
| `leo` | Dembefric | Ligue 1 | 🇫🇷 |
| `jack` | Mo Sawin | Premier League | 🏴󠁧󠁢󠁥󠁮󠁧󠁿 |
| `paco` | Belligagne | La Liga | 🇪🇸 |
| `tony` | Vlachance | Serie A | 🇮🇹 |
| `hans` | Kagnotte | Bundesliga | 🇩🇪 |

Source de vérité côté web : `app/_data/coaches.ts`.
Copie côté bot (pour les system prompts) : `bot/src/lib/coaches.ts` — garder en sync.

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
  --coach <leo|jack|paco|tony|hans> \
  --pick "<bet text>" \
  --cote <number, optionnel> \
  --fixture "<id, optionnel>" \
  --reasoning "<why, optionnel>"
```

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

- **Claude (cette session)** = source des paris officiels. Push via la CLI ci-dessus.
- **Gemma (OpenRouter, dans le bot)** = chat conversationnel. Discute des paris déjà
  partagés, NE propose JAMAIS de nouveau ticket. Si l'user demande un pari dans le
  chat, Gemma redirige : « Mes paris officiels arrivent en push ». Voir le system
  prompt dans `bot/src/lib/prompt.ts`.

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

| Table | Rôle |
|-------|------|
| `users` | identité, plan, status, telegram_id, stripe_*, locked_at |
| `auth_tokens` | tokens magic-link onboarding ('claim') et upgrade ('upgrade') |
| `user_coaches` | M2M user × coach (filtre du fan-out) |
| `picks` | paris (INSERT déclenche le webhook → fan-out) |
| `pick_deliveries` | tracking par-user (telegram_message_id, error) |
| `chat_messages` | historique chat (user_id, coach_id, role, content) |

RLS activée sur tout, policies = aucune (service-role-only).

## Don'ts

- ❌ Ne commit JAMAIS `.env.local` ou `bot/.env` (gitignored, mais double-check).
- ❌ Ne propose pas de nouveau pari dans Gemma (le system prompt l'interdit déjà).
- ❌ Ne bypass pas le filtre `coach_id` du fan-out — sinon tout le monde reçoit tout.
- ❌ Ne change pas le shape de `coaches.ts` côté web sans répercuter dans
  `bot/src/lib/coaches.ts`.
- ❌ Ne run pas `gcloud compute instances delete` ou `supabase db reset` sans
  confirmation explicite — destructif.

## Documents complémentaires

- `SETUP.md` — walkthrough complet de la mise en route (Stripe, Telegram, Supabase webhook, Vercel, GCP)
- `bot/README.md` — focus déploiement bot (template Fly.io, encore valide pour repli)
- `AGENTS.md` — warning Next.js 16 breaking changes
