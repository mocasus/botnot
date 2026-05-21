import { Bot, InputFile } from "grammy";
import { config } from "../config.js";
import { logger } from "../logger.js";
import { listProducts } from "../products/catalog.js";
import { createOrder } from "../orders/service.js";
import { registry } from "./registry.js";
import { registerTelegramAdminCommands } from "./telegram-admin.js";

export async function startTelegramBot(): Promise<void> {
  if (!config.TELEGRAM_BOT_TOKEN) {
    logger.warn("TELEGRAM_BOT_TOKEN tidak diset, skip Telegram bot");
    return;
  }

  const bot = new Bot(config.TELEGRAM_BOT_TOKEN);

  bot.command("start", (ctx) =>
    ctx.reply(
      [
        "Halo! Saya bot toko otomatis.",
        "",
        "Perintah:",
        "/catalog - Lihat daftar produk",
        "/buy <product_id> [qty] - Beli produk",
        "",
        "Setelah bayar QRIS, produk dikirim otomatis di chat ini.",
      ].join("\n"),
    ),
  );

  bot.command("catalog", async (ctx) => {
    const products = await listProducts();
    if (products.length === 0) {
      return ctx.reply("Belum ada produk tersedia.");
    }
    const lines = products.map((p) =>
      [
        `*${escapeMd(p.name)}* (\`${p.id}\`)`,
        p.description ? `_${escapeMd(p.description)}_` : null,
        `Harga: Rp${p.priceIDR.toLocaleString("id-ID")}`,
        `Stok: ${p.availableStock}`,
      ]
        .filter(Boolean)
        .join("\n"),
    );
    await ctx.reply(
      [
        "*Katalog Produk*",
        "",
        lines.join("\n\n"),
        "",
        "Beli dengan: `/buy <product_id> [qty]`",
      ].join("\n"),
      { parse_mode: "Markdown" },
    );
  });

  bot.command("buy", async (ctx) => {
    const argText = ctx.match?.toString().trim() ?? "";
    const parts = argText.split(/\s+/).filter(Boolean);
    const productId = parts[0];
    const qty = Math.max(1, parseInt(parts[1] ?? "1", 10) || 1);

    if (!productId) {
      return ctx.reply("Cara pakai: `/buy <product_id> [qty]`", { parse_mode: "Markdown" });
    }

    try {
      const { order, tx } = await createOrder({
        productId,
        qty,
        platform: "TELEGRAM",
        chatId: String(ctx.chat.id),
        username: ctx.from?.username,
      });

      const caption = [
        `*Order ${order.id}*`,
        "",
        `Total: *Rp${order.totalAmount?.toLocaleString("id-ID")}*`,
        `Berlaku sampai: ${tx.expired_at} WIB`,
        "",
        "Scan QRIS di atas untuk bayar.",
        "Produk akan otomatis dikirim setelah pembayaran terkonfirmasi.",
      ].join("\n");

      const buffer = decodeBase64Image(tx.qris_image);
      await ctx.replyWithPhoto(new InputFile(buffer, `${order.id}.png`), {
        caption,
        parse_mode: "Markdown",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      logger.error({ err }, "Telegram /buy gagal");
      await ctx.reply(`Gagal membuat order: ${message}`);
    }
  });

  // Admin commands (otomatis di-skip kalau ADMIN_TELEGRAM_IDS kosong)
  registerTelegramAdminCommands(bot);

  bot.catch((err) => logger.error({ err }, "Telegram bot error"));

  registry.telegram = bot;

  // Long polling start (non-blocking)
  bot.start({
    onStart: (info) => logger.info({ username: info.username }, "Telegram bot started"),
  });
}

function decodeBase64Image(dataUrl: string): Buffer {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
  return Buffer.from(base64, "base64");
}

function escapeMd(s: string): string {
  // basic Markdown V1 escape supaya nama produk yg punya _ atau * tidak rusak
  return s.replace(/([_*`\[\]])/g, "\\$1");
}
