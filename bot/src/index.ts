import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { webhookCallback } from "grammy";
import { bot } from "./bot.js";
import { broadcastRoute } from "./routes/broadcast.js";

const app = new Hono();

const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
if (!WEBHOOK_SECRET) {
  throw new Error("[server] Missing TELEGRAM_WEBHOOK_SECRET in environment.");
}

// Telegram webhook — Grammy parses Update from JSON body
app.post(`/webhook/${WEBHOOK_SECRET}`, webhookCallback(bot, "hono"));

// Supabase Database Webhook → fan out picks to subscribers
app.post("/broadcast", broadcastRoute);

// Healthcheck for Fly.io
app.get("/health", (c) => c.json({ ok: true, ts: new Date().toISOString() }));

const port = Number(process.env.PORT ?? 3001);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`[server] Listening on :${info.port}`);
});
