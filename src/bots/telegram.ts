import { Bot, InputFile } from "grammy";
import { config, isOwnerTelegram } from "../config.js";
import { logger } from "../logger.js";
import { listProducts } from "../products/catalog.js";
import { createOrder } from "../orders/service.js";
import { registry } from "./registry.js";
import { registerTelegramAdminCommands } from "./telegram-admin.js";
import { telegramRole } from "../admin/auth.js";
import { notifyOwner } from "../admin/owner.js";

export async function startTelegramBot(): Promise<void> {
  if (!config.TELEGRAM_BOT_TOKEN) {
    logger.warn("TELEGRAM_BOT_TOKEN tidak diset, skip Telegram bot");
    return;
  }

  const bot = new Bot(config.TELEGRAM_BOT_TOKEN);

  bot.command("start", (ctx) => {
    const role = telegramRole(ctx.from?.id);
    const greeting =
      role === "owner"
        ? `Halo *Owner*! Selamat datang kembali. Bot kamu sudah online.`
        : role === "admin"
          ? `Halo Admin! Bot toko siap digunakan.`
          : `Halo! Saya bot toko otomatis.`;

    return ctx.reply(
      [
        greeting,
        "",
        "Perintah:",
        "/catalog - Lihat daftar produk",
        "/buy <product_id> [qty] - Beli produk",
        "/whoami - Cek role kamu",
        ...(role === "owner" || role === "admin" ? ["/admin - Daftar admin commands"] : []),
        "",
        "Setelah bayar QRIS, produk dikirim otomatis di chat ini.",
      ].join("\n"),
      { parse_mode: "Markdown" },
    );
  });

  bot.command("whoami", (ctx) => {
    const role = telegramRole(ctx.from?.id);
    const labels: Record<typeof role, string> = {
      owner: "Owner",
      admin: "Admin",
      customer: "Customer",
    };
    return ctx.reply(
      [
        `*Role:* ${labels[role]}`,
        `*User ID:* \`${ctx.from?.id}\``,
        `*Username:* @${ctx.from?.username ?? "(tidak ada)"}`,
        ...(role === "owner"
          ? ["", "Kamu primary admin. Otomatis dapat notifikasi event penting."]
          : role === "admin"
            ? ["", "Kamu admin. Pakai /admin untuk lihat command admin."]
            : []),
      ].join("\n"),
      { parse_mode: "Markdown" },
    );
  });

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

  // Admin commands (otomatis di-skip kalau ADMIN_TELEGRAM_IDS & OWNER_TELEGRAM_ID kosong)
  registerTelegramAdminCommands(bot);

  bot.catch((err) => logger.error({ err }, "Telegram bot error"));

  registry.telegram = bot;

  // Long polling start (non-blocking) + greet owner saat bot online
  bot.start({
    onStart: (info) => {
      logger.info({ username: info.username }, "Telegram bot started");
      // Best-effort owner greeting (skip silently kalau OWNER_TELEGRAM_ID tidak set)
      if (config.OWNER_TELEGRAM_ID) {
        void notifyOwner(
          [
            `*Bot Online*`,
            ``,
            `Telegram bot @${info.username} siap menerima order.`,
            ``,
            `Cek /admin untuk daftar admin commands, atau /whoami untuk cek status.`,
          ].join("\n"),
        );
      }
    },
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

// Marker import biar isOwnerTelegram di-mark dipakai (untuk future use)
void isOwnerTelegram;
