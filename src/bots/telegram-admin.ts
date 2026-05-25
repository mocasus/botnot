import type { Bot, Context } from "grammy";
import { hasTelegramAdmins, isTelegramAdmin } from "../admin/auth.js";
import {
  addStock,
  createProduct,
  formatIDR,
  getStats,
  listProductsWithStock,
  listRecentOrders,
  redeliverOrder,
  toggleProductActive,
} from "../admin/service.js";
import { logger } from "../logger.js";

const ADMIN_HELP = [
  "*Admin Commands*",
  "",
  "`/stats` — Statistik penjualan",
  "`/orders [status]` — 10 order terakhir (status: pending, paid, expired)",
  "`/products` — Daftar produk + stok",
  "`/addproduct <id>|<nama>|<harga>|<desk>` — Tambah produk (pisahkan dengan |)",
  "`/addstock <product_id>` — Tambah stok (kirim payload di baris berikutnya)",
  "`/toggle <product_id>` — Aktifkan/nonaktifkan produk",
  "`/redeliver <order_id>` — Kirim ulang produk ke pembeli",
].join("\n");

function escapeMd(s: string): string {
  return s.replace(/([_*`\[\]])/g, "\\$1");
}

/**
 * Wrap handler dengan admin check. Reply tegas kalau bukan admin.
 */
function adminOnly(handler: (ctx: Context) => Promise<unknown> | unknown) {
  return async (ctx: Context) => {
    if (!isTelegramAdmin(ctx.from?.id)) {
      // Diam saja kalau bukan admin (tidak konfirmasi command admin exist)
      return;
    }
    try {
      await handler(ctx);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      logger.error({ err, userId: ctx.from?.id }, "Telegram admin command error");
      await ctx.reply(`Error: ${msg}`);
    }
  };
}

export function registerTelegramAdminCommands(bot: Bot): void {
  if (!hasTelegramAdmins()) {
    logger.warn("ADMIN_TELEGRAM_IDS kosong — admin commands Telegram dinonaktifkan");
    return;
  }

  bot.command("admin", adminOnly(async (ctx) => {
    await ctx.reply(ADMIN_HELP, { parse_mode: "Markdown" });
  }));

  bot.command("stats", adminOnly(async (ctx) => {
    const s = await getStats();
    const text = [
      "*Statistik Toko*",
      "",
      `Revenue Hari Ini: *${formatIDR(s.revenueToday)}*`,
      `Revenue 7 Hari: *${formatIDR(s.revenue7d)}*`,
      `Revenue Total: *${formatIDR(s.revenueAllTime)}*`,
      "",
      `Total Order: ${s.totalOrders}`,
      `  Pending: ${s.pending}`,
      `  Paid: ${s.paid}`,
      `  Expired: ${s.expired}`,
      "",
      `Produk Aktif: ${s.productsActive}`,
      `Stok Tersedia: ${s.stockAvailable}`,
    ].join("\n");
    await ctx.reply(text, { parse_mode: "Markdown" });
  }));

  bot.command("orders", adminOnly(async (ctx) => {
    const filter = ctx.match?.toString().trim().toUpperCase();
    const status = filter && ["PENDING", "PAID", "EXPIRED", "FAILED"].includes(filter) ? filter : undefined;
    const orders = await listRecentOrders({ status, take: 10 });
    if (orders.length === 0) {
      return ctx.reply(`Belum ada order${status ? ` dengan status ${status}` : ""}.`);
    }
    const lines = orders.map((o) => {
      const time = o.createdAt.toISOString().slice(5, 16).replace("T", " ");
      const deliveryFlag = o.delivered ? "✓" : o.status === "PAID" ? "⚠" : " ";
      return [
        `${deliveryFlag} \`${o.id}\``,
        `  ${escapeMd(o.product.name)} x${o.qty} — ${formatIDR(o.totalAmount)}`,
        `  ${o.status} · ${o.platform} · ${time}`,
      ].join("\n");
    });
    await ctx.reply(
      [`*Order Terbaru*${status ? ` (${status})` : ""}`, "", lines.join("\n\n")].join("\n"),
      { parse_mode: "Markdown" },
    );
  }));

  bot.command("products", adminOnly(async (ctx) => {
    const products = await listProductsWithStock();
    if (products.length === 0) {
      return ctx.reply("Belum ada produk.");
    }
    const lines = products.map((p) => {
      const status = p.active ? "Active" : "Inactive";
      return [
        `*${escapeMd(p.name)}* (\`${p.id}\`) — ${status}`,
        `  ${formatIDR(p.priceIDR)} · stok: ${p.available}/${p.available + p.sold}`,
      ].join("\n");
    });
    await ctx.reply(["*Daftar Produk*", "", lines.join("\n\n")].join("\n"), {
      parse_mode: "Markdown",
    });
  }));

  bot.command("addproduct", adminOnly(async (ctx) => {
    const text = ctx.match?.toString().trim() ?? "";
    if (!text) {
      return ctx.reply(
        "Format: `/addproduct ID|Nama|Harga|Deskripsi`\n" +
          "Contoh: `/addproduct NETFLIX-1B|Netflix Premium 1 Bulan|25000|Akun sharing 1 profil`",
        { parse_mode: "Markdown" },
      );
    }
    const parts = text.split("|").map((s) => s.trim());
    const [id, name, priceStr, description] = parts;
    if (!id || !name || !priceStr) {
      return ctx.reply("Field id, nama, harga wajib diisi (pisahkan dengan `|`)");
    }
    const priceIDR = parseInt(priceStr, 10);
    if (!Number.isFinite(priceIDR) || priceIDR <= 0) {
      return ctx.reply("Harga harus angka > 0");
    }
    const product = await createProduct({ id, name, priceIDR, description });
    await ctx.reply(
      `Produk *${escapeMd(product.name)}* (\`${product.id}\`) berhasil dibuat.\n` +
        `Tambah stok dengan: \`/addstock ${product.id}\``,
      { parse_mode: "Markdown" },
    );
  }));

  bot.command("addstock", adminOnly(async (ctx) => {
    // Format: first line "/addstock <product_id>"
    // Subsequent lines = payloads (one per line)
    const fullText = ctx.message?.text ?? "";
    const lines = fullText.split(/\r?\n/);
    const firstLineParts = (lines[0] ?? "").split(/\s+/);
    const productId = firstLineParts[1]?.trim();
    if (!productId) {
      return ctx.reply(
        "Format:\n```\n/addstock <product_id>\npayload1\npayload2\n...\n```",
        { parse_mode: "Markdown" },
      );
    }
    const payloads = lines.slice(1);
    if (payloads.filter((p) => p.trim()).length === 0) {
      return ctx.reply("Tambahkan minimal 1 payload di baris berikutnya.");
    }
    const added = await addStock(productId, payloads);
    await ctx.reply(`*${added}* item stok berhasil ditambahkan untuk \`${productId}\`.`, {
      parse_mode: "Markdown",
    });
  }));

  bot.command("toggle", adminOnly(async (ctx) => {
    const productId = ctx.match?.toString().trim();
    if (!productId) {
      return ctx.reply("Format: `/toggle <product_id>`", { parse_mode: "Markdown" });
    }
    const p = await toggleProductActive(productId);
    await ctx.reply(`Produk *${escapeMd(p.name)}* sekarang ${p.active ? "AKTIF" : "NONAKTIF"}.`, {
      parse_mode: "Markdown",
    });
  }));

  bot.command("redeliver", adminOnly(async (ctx) => {
    const orderId = ctx.match?.toString().trim();
    if (!orderId) {
      return ctx.reply("Format: `/redeliver <order_id>`", { parse_mode: "Markdown" });
    }
    await redeliverOrder(orderId);
    await ctx.reply(`Order \`${orderId}\` berhasil dikirim ulang.`, { parse_mode: "Markdown" });
  }));

  logger.info("Telegram admin commands registered");
}
