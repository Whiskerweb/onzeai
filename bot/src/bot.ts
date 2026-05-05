import { Bot } from "grammy";
import { startHandler } from "./handlers/start.js";
import { helpHandler } from "./handlers/help.js";
import { coachCommandHandler, coachListHandler } from "./handlers/coach.js";
import { quotaCommandHandler } from "./handlers/quota.js";
import { chatHandler } from "./handlers/chat.js";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error("[bot] Missing TELEGRAM_BOT_TOKEN in environment.");
}

export const bot = new Bot(token);

bot.command("start", startHandler);
bot.command("help", helpHandler);
bot.command("coach", coachCommandHandler);
bot.command("coachs", coachListHandler);
bot.command("quota", quotaCommandHandler);

// All other text messages (including the /<coachName> prefix style) → chat
bot.on("message:text", chatHandler);

bot.catch((err) => {
  console.error("[bot] unhandled error", err);
});
