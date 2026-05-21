import Fastify from "fastify";
import cookie from "@fastify/cookie";
import formbody from "@fastify/formbody";
import { config, isDashboardConfigured, isKlikqrisConfigured } from "./config.js";
import { logger } from "./logger.js";
import { registerWebhookRoutes } from "./payment/webhook.js";
import { registerAdminDashboardRoutes } from "./admin/dashboard/routes.js";
import { startTelegramBot } from "./bots/telegram.js";
import { startDiscordBot } from "./bots/discord.js";
import { prisma } from "./db.js";

async function main() {
  printStartupWarnings();

  const app = Fastify({
    // Disable Fastify HTTP logging — kita pakai pino logger langsung di route handlers.
    logger: false,
  });

  // Plugin: parse application/x-www-form-urlencoded (untuk admin dashboard forms)
  await app.register(formbody);

  // Plugin: signed cookies untuk session admin dashboard
  await app.register(cookie, {
    secret: config.ADMIN_SESSION_SECRET,
  });

  registerWebhookRoutes(app);

  if (isDashboardConfigured()) {
    registerAdminDashboardRoutes(app);
    logger.info("Admin dashboard enabled at /admin");
  } else {
    logger.warn("Admin dashboard disabled (ADMIN_USERNAME/ADMIN_PASSWORD belum diset)");
  }

  await app.listen({ host: "0.0.0.0", port: config.PORT });
  logger.info({ port: config.PORT }, "HTTP server listening");

  // Start kedua bot paralel; masing-masing kerja sendiri.
  await Promise.all([startTelegramBot(), startDiscordBot()]);

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutting down...");
    try {
      await app.close();
      await prisma.$disconnect();
    } catch (err) {
      logger.error({ err }, "Shutdown error");
    } finally {
      process.exit(0);
    }
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

function printStartupWarnings() {
  if (!isKlikqrisConfigured()) {
    logger.warn(
      "KlikQRIS belum dikonfigurasi (KLIKQRIS_API_KEY / KLIKQRIS_MERCHANT_ID kosong). " +
        "Bot tetap jalan, tapi /buy akan gagal sampai diisi.",
    );
  }
  if (
    config.ADMIN_SESSION_SECRET === "change-me-in-production-please" &&
    config.NODE_ENV === "production"
  ) {
    logger.warn(
      "ADMIN_SESSION_SECRET masih default. Generate yang random untuk production: openssl rand -hex 32",
    );
  }
}

main().catch((err) => {
  logger.error({ err }, "Fatal error, exit");
  process.exit(1);
});
