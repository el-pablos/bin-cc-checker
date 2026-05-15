import { Bot, GrammyError, HttpError } from "grammy";
import { setupCommands } from "./commands";
import { setupCallbacks } from "./handlers";

let bot: Bot | null = null;

export function startBot() {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    console.warn("BOT_TOKEN not set, skipping bot startup");
    return;
  }

  bot = new Bot(token);

  const allowedUserId = Number(process.env.ALLOWED_USER_ID);

  bot.use(async (ctx, next) => {
    if (allowedUserId && ctx.from?.id !== allowedUserId) {
      await ctx.reply(
        "⛔ Akses ditolak. Bot ini hanya untuk user yang diizinkan.",
      );
      return;
    }
    await next();
  });

  setupCommands(bot);
  setupCallbacks(bot);

  bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
      console.error("Error in request:", e.description);
    } else if (e instanceof HttpError) {
      console.error("Could not contact Telegram:", e);
    } else {
      console.error("Unknown error:", e);
    }
  });

  bot.start({
    onStart: () => console.log("Telegram bot started (polling)"),
  });
}

export function getBot() {
  return bot;
}
