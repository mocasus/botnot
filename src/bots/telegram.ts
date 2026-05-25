import { Bot, type Context, InlineKeyboard, InputFile } from "grammy";
import { config } from "../config.js";
import { logger } from "../logger.js";
import { prisma } from "../db.js";
import { listProducts } from "../products/catalog.js";
import { createOrder } from "../orders/service.js";
import { registry } from "./registry.js";
import { registerTelegramAdminCommands } from "./telegram-admin.js";
import { telegramRole } from "../admin/auth.js";
import { notifyOwner } from "../admin/owner.js";

/**
 * Callback data formats (Telegram limit: 64 bytes):
 *   menu:<action>          → action = catalog | help | whoami | start
 *   prod:<id>              → buka detail produk
 *   buy:<id>:<qty>         → eksekusi pembelian
 *   status:<orderId>       → cek status order
 */

export async function startTelegramBot(): Promise<void> {
  if (!config.TELEGRAM_BOT_TOKEN) {
    logger.warn("TELEGRAM_BOT_TOKEN tidak diset, skip Telegram bot");
    return;
  }

  const bot = new Bot(config.TELEGRAM_BOT_TOKEN);

  bot.command("start", async (ctx) => sendMainMenu(ctx, "reply"));
  bot.command("catalog", async (ctx) => sendCatalog(ctx, "reply"));
  bot.command("whoami", async (ctx) => sendWhoami(ctx));

  // Backward-compat: text command /buy <id> [qty] tetap jalan untuk power user
  bot.command("buy", async (ctx) => {
    const parts = (ctx.match?.toString() ?? "").trim().split(/\s+/).filter(Boolean);
    const productId = parts[0];
    const qty = Math.max(1, parseInt(parts[1] ?? "1", 10) || 1);
    if (!productId) {
      return ctx.reply("Cara pakai: `/buy <product_id> [qty]`\nAtau pakai /catalog buat lihat tombol-tombol.", {
        parse_mode: "Markdown",
      });
    }
    await executeBuy(ctx, productId, qty);
  });

  // === Callback query router ===
  bot.callbackQuery(/^menu:(.+)$/, async (ctx) => {
    const action = ctx.match[1];
    if (action === "catalog") await sendCatalog(ctx, "edit");
    else if (action === "start") await sendMainMenu(ctx, "edit");
    else if (action === "help") await sendHelp(ctx);
    else if (action === "whoami") await sendWhoami(ctx);
    await ctx.answerCallbackQuery().catch(() => {});
  });

  bot.callbackQuery(/^prod:(.+)$/, async (ctx) => {
    const id = ctx.match[1];
    await showProductDetail(ctx, id);
    await ctx.answerCallbackQuery().catch(() => {});
  });

  bot.callbackQuery(/^buy:([^:]+):(\d+)$/, async (ctx) => {
    const id = ctx.match[1];
    const qty = parseInt(ctx.match[2], 10);
    await ctx.answerCallbackQuery({ text: "Membuat order…" }).catch(() => {});
    await executeBuy(ctx, id, qty);
  });

  bot.callbackQuery(/^status:(.+)$/, async (ctx) => {
    const orderId = ctx.match[1];
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { product: true },
    });
    if (!order) {
      await ctx.answerCallbackQuery({ text: "Order tidak ditemukan", show_alert: true });
      return;
    }
    const txt =
      order.status === "PAID" && order.delivered
        ? `✓ Order *${order.id}* sudah dibayar dan terkirim.`
        : order.status === "PAID"
          ? `Order *${order.id}* sudah dibayar, sedang dikirim…`
          : order.status === "EXPIRED"
            ? `Order *${order.id}* sudah expired.`
            : `Order *${order.id}* masih PENDING. Silakan bayar QRIS.`;
    await ctx.answerCallbackQuery({ text: order.status, show_alert: false });
    await ctx.reply(txt, { parse_mode: "Markdown" });
  });

  // Admin commands tetap text-based
  registerTelegramAdminCommands(bot);

  bot.catch((err) => logger.error({ err }, "Telegram bot error"));

  registry.telegram = bot;

  bot.start({
    onStart: async (info) => {
      logger.info({ username: info.username }, "Telegram bot started");
      // Set bot commands menu (muncul sebagai tombol "/" di Telegram)
      await bot.api
        .setMyCommands([
          { command: "start", description: "Mulai" },
          { command: "catalog", description: "Lihat produk" },
          { command: "whoami", description: "Cek role kamu" },
        ])
        .catch((err) => logger.warn({ err }, "Failed to set bot commands"));

      if (config.OWNER_TELEGRAM_ID) {
        void notifyOwner(
          [`*Bot Online*`, ``, `Telegram bot @${info.username} siap menerima order.`].join("\n"),
        );
      }
    },
  });
}

// ============ Renderers ============

async function sendMainMenu(ctx: Context, mode: "reply" | "edit"): Promise<void> {
  const role = telegramRole(ctx.from?.id);
  const greeting =
    role === "owner"
      ? `Halo *Owner* ${escapeMd(ctx.from?.first_name ?? "")}!\nBot kamu sudah online dan siap melayani pembeli.`
      : role === "admin"
        ? `Halo *Admin*!\nBot toko siap digunakan.`
        : `Halo *${escapeMd(ctx.from?.first_name ?? "kamu")}*!\nSelamat datang di toko otomatis kami.`;

  const kb = new InlineKeyboard()
    .text("📦 Lihat Katalog", "menu:catalog")
    .row()
    .text("ℹ️ Bantuan", "menu:help")
    .text("👤 Profile", "menu:whoami");

  if (role === "owner" || role === "admin") {
    kb.row().text("⚙️ Admin Commands", "menu:help");
  }

  const text = [greeting, "", "Pilih menu di bawah:"].join("\n");

  if (mode === "edit" && ctx.callbackQuery?.message) {
    await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb }).catch(() => {});
  } else {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  }
}

async function sendCatalog(ctx: Context, mode: "reply" | "edit"): Promise<void> {
  const products = await listProducts();
  const kb = new InlineKeyboard();

  if (products.length === 0) {
    const text = "_Belum ada produk tersedia._";
    if (mode === "edit" && ctx.callbackQuery?.message) {
      await ctx.editMessageText(text, { parse_mode: "Markdown" }).catch(() => {});
    } else {
      await ctx.reply(text, { parse_mode: "Markdown" });
    }
    return;
  }

  // 1 produk per row supaya nama panjang gak ketabrak
  for (const p of products) {
    const stock = p.availableStock > 0 ? `${p.availableStock} stok` : "stok habis";
    const label = `${p.name} · Rp${p.priceIDR.toLocaleString("id-ID")} · ${stock}`;
    // Telegram label limit ~64 chars
    const trimmed = label.length > 60 ? label.slice(0, 57) + "…" : label;
    kb.text(trimmed, `prod:${p.id}`).row();
  }
  kb.text("← Kembali", "menu:start");

  const text = [
    "*Katalog Produk*",
    "",
    "Klik produk untuk lihat detail dan beli.",
    "",
    `_${products.length} produk tersedia_`,
  ].join("\n");

  if (mode === "edit" && ctx.callbackQuery?.message) {
    await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb }).catch(() => {});
  } else {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  }
}

async function showProductDetail(ctx: Context, productId: string): Promise<void> {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    await ctx.reply("Produk tidak ditemukan.");
    return;
  }
  const available = await prisma.stock.count({ where: { productId, used: false } });

  const lines = [
    `*${escapeMd(product.name)}*`,
    `\`${product.id}\` · ${escapeMd(product.type)}`,
    "",
    product.description ? `_${escapeMd(product.description)}_\n` : "",
    `💰 *Harga:* Rp${product.priceIDR.toLocaleString("id-ID")}`,
    `📦 *Stok:* ${available}`,
  ].filter(Boolean);

  const kb = new InlineKeyboard();
  if (available > 0) {
    kb.text("Beli 1", `buy:${product.id}:1`);
    if (available >= 3) kb.text("Beli 3", `buy:${product.id}:3`);
    if (available >= 5) kb.text("Beli 5", `buy:${product.id}:5`);
    kb.row();
  }
  kb.text("← Katalog", "menu:catalog");

  if (ctx.callbackQuery?.message) {
    await ctx.editMessageText(lines.join("\n"), { parse_mode: "Markdown", reply_markup: kb }).catch(() => {});
  } else {
    await ctx.reply(lines.join("\n"), { parse_mode: "Markdown", reply_markup: kb });
  }
}

async function executeBuy(ctx: Context, productId: string, qty: number): Promise<void> {
  if (!ctx.chat?.id) return;
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
      `*${escapeMd(tx.nama_toko)}*`,
      `${escapeMd(tx.keterangan ?? "")}`,
      "",
      `Total: *Rp${order.totalAmount?.toLocaleString("id-ID")}*`,
      `Berlaku sampai: ${tx.expired_at} WIB`,
      "",
      "Scan QRIS di atas untuk bayar.",
      "Produk akan otomatis dikirim setelah pembayaran terkonfirmasi.",
    ].join("\n");

    const kb = new InlineKeyboard()
      .text("🔄 Cek Status", `status:${order.id}`)
      .url("💬 Bantuan", "https://t.me/")
      .row()
      .text("← Katalog", "menu:catalog");

    const buffer = decodeBase64Image(tx.qris_image);
    await ctx.replyWithPhoto(new InputFile(buffer, `${order.id}.png`), {
      caption,
      parse_mode: "Markdown",
      reply_markup: kb,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error({ err }, "Telegram buy failed");
    await ctx.reply(`❌ Gagal membuat order: ${message}`);
  }
}

async function sendHelp(ctx: Context): Promise<void> {
  const role = telegramRole(ctx.from?.id);
  const lines = [
    "*Bantuan*",
    "",
    "Cara beli:",
    "1. Klik *📦 Lihat Katalog*",
    "2. Pilih produk",
    "3. Klik tombol *Beli*",
    "4. Scan QRIS yang dikirim bot",
    "5. Produk dikirim otomatis ke chat ini",
    "",
    "Command:",
    "`/start` — menu utama",
    "`/catalog` — lihat produk",
    "`/buy <id> [qty]` — beli langsung (power user)",
    "`/whoami` — cek role kamu",
  ];
  if (role === "owner" || role === "admin") {
    lines.push("", "*Admin commands:*", "`/admin` — daftar admin commands");
  }
  await ctx.reply(lines.join("\n"), { parse_mode: "Markdown" });
}

async function sendWhoami(ctx: Context): Promise<void> {
  const role = telegramRole(ctx.from?.id);
  const labels: Record<typeof role, string> = {
    owner: "👑 Owner",
    admin: "🛡️ Admin",
    customer: "👤 Customer",
  };
  await ctx.reply(
    [
      `*Role:* ${labels[role]}`,
      `*User ID:* \`${ctx.from?.id}\``,
      `*Username:* @${ctx.from?.username ?? "(tidak ada)"}`,
    ].join("\n"),
    { parse_mode: "Markdown" },
  );
}

// ============ Helpers ============

function decodeBase64Image(dataUrl: string): Buffer {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
  return Buffer.from(base64, "base64");
}

function escapeMd(s: string): string {
  return s.replace(/([_*`\[\]])/g, "\\$1");
}
