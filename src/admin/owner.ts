import { config } from "../config.js";
import { logger } from "../logger.js";
import { registry } from "../bots/registry.js";

/**
 * Best-effort kirim notifikasi ke owner via Telegram & Discord.
 * Tidak throw kalau gagal — biar event lain (delivery, dll) tetap jalan.
 */
export async function notifyOwner(message: string): Promise<void> {
  const tasks: Promise<unknown>[] = [];

  if (config.OWNER_TELEGRAM_ID && registry.telegram) {
    tasks.push(
      registry.telegram.api
        .sendMessage(config.OWNER_TELEGRAM_ID, message, { parse_mode: "Markdown" })
        .catch((err) => logger.warn({ err }, "notifyOwner Telegram failed")),
    );
  }

  if (config.OWNER_DISCORD_ID && registry.discord) {
    tasks.push(
      registry.discord.users
        .fetch(config.OWNER_DISCORD_ID)
        .then((user) => user.send(message))
        .catch((err) => logger.warn({ err }, "notifyOwner Discord failed")),
    );
  }

  if (tasks.length === 0) {
    logger.debug("notifyOwner skipped: no owner ID configured or bots not running");
    return;
  }

  await Promise.allSettled(tasks);
}

export function hasOwner(): boolean {
  return Boolean(config.OWNER_TELEGRAM_ID || config.OWNER_DISCORD_ID);
}
