// Registers the Telegram webhook URL with the Bot API.
// Usage:
//   BOT_BASE_URL=https://onze-bot.fly.dev npm run set-webhook
//
// Reads from env:
//   - TELEGRAM_BOT_TOKEN
//   - TELEGRAM_WEBHOOK_SECRET
//   - BOT_BASE_URL (the public URL where the bot is reachable)
export {};

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const baseUrl = process.env.BOT_BASE_URL;

if (!token) throw new Error("Missing TELEGRAM_BOT_TOKEN");
if (!secret) throw new Error("Missing TELEGRAM_WEBHOOK_SECRET");
if (!baseUrl) throw new Error("Missing BOT_BASE_URL (e.g. https://onze-bot.fly.dev)");

const url = `${baseUrl.replace(/\/$/, "")}/webhook/${secret}`;

const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: true,
  }),
});
const json = await res.json();
console.log(JSON.stringify(json, null, 2));
if (!json.ok) process.exit(1);
