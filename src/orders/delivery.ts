import { prisma } from "../db.js";
import { logger } from "../logger.js";
import { registry } from "../bots/registry.js";

/**
 * Allocate stok untuk order dan kirim ke pembeli via Telegram/Discord DM.
 * Idempoten: kalau order.delivered=true, langsung skip.
 */
export async function deliverOrder(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { product: true },
  });
  if (!order) throw new Error(`Order ${orderId} tidak ditemukan`);
  if (order.delivered) {
    logger.info({ orderId }, "Order already delivered, skip");
    return;
  }

  // Allocate stok dalam transaction supaya tidak race condition
  const payloads: string[] = [];
  await prisma.$transaction(async (db) => {
    for (let i = 0; i < order.qty; i++) {
      const stock = await db.stock.findFirst({
        where: { productId: order.productId, used: false },
        orderBy: { id: "asc" },
      });
      if (!stock) {
        throw new Error(`Stok ${order.productId} habis saat delivery (order ${orderId})`);
      }
      await db.stock.update({
        where: { id: stock.id },
        data: { used: true, usedAt: new Date() },
      });
      payloads.push(stock.payload);
    }
    await db.order.update({
      where: { id: orderId },
      data: { delivered: true, deliveredAt: new Date() },
    });
  });

  const message = formatDeliveryMessage(order.product.name, payloads);

  try {
    if (order.platform === "TELEGRAM") {
      const bot = registry.telegram;
      if (!bot) throw new Error("Telegram bot not running");
      await bot.api.sendMessage(order.chatId, message, { parse_mode: "Markdown" });
    } else if (order.platform === "DISCORD") {
      const client = registry.discord;
      if (!client) throw new Error("Discord bot not running");
      const user = await client.users.fetch(order.chatId);
      await user.send(message);
    }
    logger.info({ orderId, qty: order.qty, platform: order.platform }, "Order delivered");
  } catch (err) {
    logger.error({ err, orderId }, "Gagal kirim DM ke user (produk sudah di-allocate)");
    throw err;
  }
}

function formatDeliveryMessage(productName: string, payloads: string[]): string {
  const items = payloads
    .map((p, i) => `*Item ${i + 1}:*\n\`\`\`\n${p}\n\`\`\``)
    .join("\n");
  return [
    `Pembayaran *${productName}* SUKSES!`,
    "",
    "Berikut produk Anda:",
    items,
    "",
    "Simpan baik-baik. Terima kasih sudah berbelanja!",
  ].join("\n");
}
