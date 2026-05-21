import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(3000),

  // KlikQRIS — optional supaya bot/dashboard bisa start dulu, validasi runtime saat create transaksi.
  KLIKQRIS_API_BASE: z.string().default("https://klikqris.com/api"),
  KLIKQRIS_API_KEY: z.string().default(""),
  KLIKQRIS_MERCHANT_ID: z.string().default(""),

  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().optional(),

  // Discord
  DISCORD_BOT_TOKEN: z.string().optional(),
  DISCORD_CLIENT_ID: z.string().optional(),
  DISCORD_GUILD_ID: z.string().optional(),

  // Admin (CSV list of user IDs yg boleh pakai /admin di bot)
  ADMIN_TELEGRAM_IDS: z.string().default(""),
  ADMIN_DISCORD_IDS: z.string().default(""),

  // Web dashboard
  ADMIN_USERNAME: z.string().default(""),
  ADMIN_PASSWORD: z.string().default(""),
  ADMIN_SESSION_SECRET: z.string().default("change-me-in-production-please"),

  // Database
  DATABASE_URL: z.string().default("file:./dev.db"),
  PUBLIC_BASE_URL: z.string().optional(),
});

export const config = schema.parse(process.env);

export function parseIdList(csv: string): Set<string> {
  return new Set(
    csv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

export const adminTelegramIds = parseIdList(config.ADMIN_TELEGRAM_IDS);
export const adminDiscordIds = parseIdList(config.ADMIN_DISCORD_IDS);

export function isKlikqrisConfigured(): boolean {
  return Boolean(config.KLIKQRIS_API_KEY && config.KLIKQRIS_MERCHANT_ID);
}

export function isDashboardConfigured(): boolean {
  return Boolean(config.ADMIN_USERNAME && config.ADMIN_PASSWORD);
}
