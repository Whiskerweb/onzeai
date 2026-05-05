# Onze.ai bot

Telegram bot deployable on Fly.io. Uses Grammy for Telegram, Hono for the HTTP server,
Supabase for state, OpenRouter for the LLM chat.

## Local dev

1. Copy `.env.example` to `.env` and fill the values:
   - `TELEGRAM_BOT_TOKEN` — from [@BotFather](https://t.me/BotFather)
   - `TELEGRAM_WEBHOOK_SECRET` — random string (e.g. `openssl rand -hex 32`)
   - `BROADCAST_SHARED_SECRET` — random string used to authenticate Supabase webhook calls
   - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from the Supabase dashboard
   - `OPENROUTER_API_KEY` from openrouter.ai

2. Install and run:
   ```bash
   npm install
   npm run dev
   ```

3. To test locally with Telegram, expose your dev server with ngrok or `cloudflared`:
   ```bash
   npx cloudflared tunnel --url http://localhost:3001
   # then:
   BOT_BASE_URL=https://<your-tunnel>.trycloudflare.com npm run set-webhook
   ```

## Deploy to Fly.io

```bash
fly launch --no-deploy           # answers: app name "onze-bot", region "cdg", no DB/redis
fly secrets set \
  TELEGRAM_BOT_TOKEN=... \
  TELEGRAM_WEBHOOK_SECRET=... \
  BROADCAST_SHARED_SECRET=... \
  SUPABASE_URL=... \
  SUPABASE_SERVICE_ROLE_KEY=... \
  OPENROUTER_API_KEY=... \
  OPENROUTER_MODEL=google/gemma-4-31b-it:free \
  APP_URL=https://onzeai.com
fly deploy
```

After first deploy:

```bash
BOT_BASE_URL=https://onze-bot.fly.dev TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=... npm run set-webhook
```

## Supabase Database Webhook (broadcast)

Go to **Database → Webhooks → Create a new hook**:

- Name: `broadcast_picks`
- Table: `public.onze_picks`
- Events: `INSERT`
- Type: HTTP Request
- HTTP method: `POST`
- URL: `https://onze-bot.fly.dev/broadcast`
- HTTP headers: `x-shared-secret: <BROADCAST_SHARED_SECRET>`

Now any `INSERT INTO onze_picks(...)` will fan-out a Telegram message to every active subscriber
of that coach.

## Test pipeline manually

```sql
INSERT INTO public.onze_picks (coach_id, fixture_id, pick_text, reasoning, cote)
VALUES ('leo', 'lens-nantes-2026-05-08',
        'Combiné : Lens gagne + Sotoca buteur + plus de 1.5 buts',
        'Lens invaincu à Bollaert sur 9 matchs, Sotoca 4 buts en 6 matchs.',
        6.48);
```

Check `public.onze_pick_deliveries` to see who received it. Errors (user blocked the bot,
network, etc.) are logged in the `error` column.

## Architecture

```
Web (Next.js)             Bot (Fly.io)            Supabase
─────────────             ─────────────           ─────────────
/start             ─────▶ /webhook/<secret>       onze_users
                          (Telegram updates)      onze_auth_tokens
/start/success    ─token─▶  ─/start <token>───▶   onze_user_coaches
                                                  onze_picks      ─INSERT─▶
                            /broadcast       ◀─── (Database Webhook)
                          (fan out picks)
                            chat (text msg) ───▶ OpenRouter
```
