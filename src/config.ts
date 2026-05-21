import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(3000),

  KLIKQRIS_API_BASE: z.string().default("https://klikqris.com/api"),
  KLIKQRIS_API_KEY: z.string().min(1, "KLIKQRIS_API_KEY wajib diisi"),
  KLIKQRIS_MERCHANT_ID: z.string().min(1, "KLIKQRIS_MERCHANT_ID wajib diisi"),

  TELEGRAM_BOT_TOKEN: z.string().optional(),

  DISCORD_BOT_TOKEN: z.string().optional(),
  DISCORD_CLIENT_ID: z.string().optional(),
  DISCORD_GUILD_ID: z.string().optional(),

  DATABASE_URL: z.string().default("file:./prisma/dev.db"),
  PUBLIC_BASE_URL: z.string().optional(),
});

export const config = schema.parse(process.env);
