# Onze.ai — setup end-to-end

This document tracks everything needed to run the SaaS in production. Code is in place; what
remains is filling secrets and provisioning the third-party services.

## 1. Supabase (DB + auth tokens + chat history)

Project: `https://supabase.com/dashboard/project/thcwlydkvkbahospltoo`

**Apply the migration** (one of):

- **Dashboard SQL editor** → paste the content of `supabase/migrations/0001_onzeai_init.sql` and run.
- **CLI**:
  ```
  supabase login
  supabase link --project-ref thcwlydkvkbahospltoo
  supabase db push
  ```

**Get the secrets** (Settings → API):

- `NEXT_PUBLIC_SUPABASE_URL` = `https://thcwlydkvkbahospltoo.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = the **service_role secret** (NOT the publishable/anon key)

Add both to `.env.local` (web) and `bot/.env` (bot, with `SUPABASE_URL` instead of `NEXT_PUBLIC_…`).

## 2. Stripe (subscriptions with 7-day trial)

Create three Products with one recurring monthly Price each, in EUR:
- `Solo` 14,90 €/mois
- `Squad` 29,90 €/mois
- `All Access` 49,90 €/mois

Copy the price IDs into `.env.local`:

```
STRIPE_SECRET_KEY=sk_live_…
STRIPE_WEBHOOK_SECRET=whsec_…
STRIPE_PRICE_SOLO=price_…
STRIPE_PRICE_SQUAD=price_…
STRIPE_PRICE_ALL=price_…
```

**Webhook**: in Stripe dashboard → Developers → Webhooks → Add endpoint →
`https://onzeai.com/api/stripe/webhook`. Listen to:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.subscription.trial_will_end`

For local testing:
```
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

## 3. Telegram bot

1. Create the bot via [@BotFather](https://t.me/BotFather) → `/newbot` → choose name + username.
2. Copy the bot token into `bot/.env` as `TELEGRAM_BOT_TOKEN`.
3. Set the username (without `@`) into `.env.local` as `TELEGRAM_BOT_USERNAME` (used to build the deep link).
4. Generate two random secrets and put them in `bot/.env`:
   - `TELEGRAM_WEBHOOK_SECRET` (e.g. `openssl rand -hex 24`)
   - `BROADCAST_SHARED_SECRET` (e.g. `openssl rand -hex 24`)

## 4. OpenRouter

Free model already wired (`google/gemma-4-31b-it:free`). API key already in `bot/.env`.

If the chosen model is unavailable, swap `OPENROUTER_MODEL` for any other free model on
[openrouter.ai/models](https://openrouter.ai/models?max_price=0).

## 5. Deploy the bot to Fly.io

```bash
cd bot
fly launch --no-deploy            # app name "onze-bot", region "cdg"
fly secrets set \
  TELEGRAM_BOT_TOKEN=… \
  TELEGRAM_WEBHOOK_SECRET=… \
  BROADCAST_SHARED_SECRET=… \
  SUPABASE_URL=https://thcwlydkvkbahospltoo.supabase.co \
  SUPABASE_SERVICE_ROLE_KEY=… \
  OPENROUTER_API_KEY=… \
  OPENROUTER_MODEL=google/gemma-4-31b-it:free \
  APP_URL=https://onzeai.com
fly deploy

# After deploy, register the Telegram webhook:
BOT_BASE_URL=https://onze-bot.fly.dev TELEGRAM_BOT_TOKEN=… TELEGRAM_WEBHOOK_SECRET=… npm run set-webhook
```

## 6. Supabase Database Webhook (broadcast picks)

In the Supabase dashboard → Database → Webhooks → Create:

- Name: `broadcast_picks`
- Table: `public.onze_picks`
- Events: ✅ INSERT
- Type: `HTTP Request`
- Method: `POST`
- URL: `https://onze-bot.fly.dev/broadcast`
- HTTP headers: `x-shared-secret` = `<BROADCAST_SHARED_SECRET>`

## 7. Test the full flow

1. `npm run dev` (web)
2. Open `http://localhost:3000/start?plan=solo`
3. Pick a coach, enter your email, submit
4. Pay with Stripe test card `4242 4242 4242 4242`
5. Get redirected to `/start/success` → automatic redirect to `t.me/<bot>?start=<token>`
6. In Telegram, tap **Start** → bot saves your `telegram_id` and welcomes you
7. Insert a manual pick:
   ```sql
   INSERT INTO public.onze_picks (coach_id, fixture_id, pick_text, reasoning, cote)
   VALUES ('leo', 'demo-fixture',
           'Combiné démo : Lens vainqueur + +1.5 buts',
           'Test du pipeline broadcast.', 1.85);
   ```
8. The bot delivers the message in Telegram. `public.onze_pick_deliveries` is filled.
9. Send a free-text message to the bot → Gemma replies in the voice of the active coach.

## 8. Manual checks against the schema

```sql
select id, email, plan, telegram_id, subscription_status, trial_ends_at
from public.onze_users order by created_at desc limit 5;

select * from public.onze_user_coaches limit 10;
select * from public.onze_chat_messages order by created_at desc limit 10;
select * from public.onze_pick_deliveries order by delivered_at desc limit 10;
```

## Out of scope (V1)

- Daily picks generator agent (you'll run it locally and INSERT into `onze_picks`)
- Web dashboard for the user (everything happens in Telegram)
- Stripe Customer Portal (V1.5)
- Multi-bot setup (V2 — for now, all coaches share one bot)
- Retry logic for Telegram delivery failures (errors logged in `onze_pick_deliveries.error`)
