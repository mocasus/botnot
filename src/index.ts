import Fastify from "fastify";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { registerWebhookRoutes } from "./payment/webhook.js";
import { startTelegramBot } from "./bots/telegram.js";
import { startDiscordBot } from "./bots/discord.js";
import { prisma } from "./db.js";

async function main() {
  const app = Fastify({
    // pakai pino instance kita biar log seragam
    loggerInstance: logger,
  });

  registerWebhookRoutes(app);

  await app.listen({ host: "0.0.0.0", port: config.PORT });
  logger.info({ port: config.PORT }, "Webhook server listening");

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

main().catch((err) => {
  logger.error({ err }, "Fatal error, exit");
  process.exit(1);
});
