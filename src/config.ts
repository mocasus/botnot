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

  // Owner — primary admin yg dapet notifikasi event penting (bot online, delivery gagal, dll)
  // Otomatis termasuk dalam ADMIN_*_IDS, tidak perlu didouble.
  OWNER_TELEGRAM_ID: z.string().default(""),
  OWNER_DISCORD_ID: z.string().default(""),

  // Admin tambahan (CSV list of user IDs yg boleh pakai /admin di bot)
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

function parseIdList(csv: string): Set<string> {
  return new Set(
    csv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

// Owner OTOMATIS termasuk admin (jadi user gak perlu listing dirinya 2x).
export const adminTelegramIds = (() => {
  const set = parseIdList(config.ADMIN_TELEGRAM_IDS);
  if (config.OWNER_TELEGRAM_ID) set.add(config.OWNER_TELEGRAM_ID);
  return set;
})();

export const adminDiscordIds = (() => {
  const set = parseIdList(config.ADMIN_DISCORD_IDS);
  if (config.OWNER_DISCORD_ID) set.add(config.OWNER_DISCORD_ID);
  return set;
})();

export function isKlikqrisConfigured(): boolean {
  return Boolean(config.KLIKQRIS_API_KEY && config.KLIKQRIS_MERCHANT_ID);
}

export function isDashboardConfigured(): boolean {
  return Boolean(config.ADMIN_USERNAME && config.ADMIN_PASSWORD);
}

export function isFirstRun(): boolean {
  // First-run = belum ada admin password sama sekali.
  // Setup wizard akan dibuka dalam kondisi ini.
  return !isDashboardConfigured();
}

export function isOwnerTelegram(userId: string | number | undefined): boolean {
  if (userId === undefined || !config.OWNER_TELEGRAM_ID) return false;
  return String(userId) === config.OWNER_TELEGRAM_ID;
}

export function isOwnerDiscord(userId: string | undefined): boolean {
  if (!userId || !config.OWNER_DISCORD_ID) return false;
  return userId === config.OWNER_DISCORD_ID;
}
