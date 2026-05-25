import { prisma } from "../db.js";
import { logger } from "../logger.js";
import { registry } from "../bots/registry.js";
import { notifyOwner } from "../admin/owner.js";

/**
 * Allocate stok untuk order dan kirim ke pembeli via Telegram/Discord DM.
 *
 * Retry-safe flow:
 *   1. Stok dialokasikan dalam DB transaction → payloads disimpan di order.deliveryPayload
 *      sehingga retry tidak men-double-claim stok.
 *   2. DM dikirim. Kalau gagal, lastDeliveryError diset; admin bisa retry via dashboard
 *      (atau webhook ulang) — kita ambil dari deliveryPayload yang sudah ada.
 *   3. Hanya setelah DM sukses, order.delivered diset true.
 *   4. Owner di-notify untuk: order sukses (sales notif) ATAU delivery gagal (alert).
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

  // Step 1: pastikan stok sudah ter-allocate untuk order ini
  let payloads: string[];
  if (order.deliveryPayload) {
    payloads = JSON.parse(order.deliveryPayload) as string[];
    logger.info({ orderId, attempts: order.deliveryAttempts }, "Retrying delivery with existing payloads");
  } else {
    payloads = await allocateStock(orderId, order.productId, order.qty);
  }

  // Step 2: kirim DM
  const message = formatDeliveryMessage(order.product.name, payloads);
  try {
    await sendToUser(order.platform, order.chatId, message);
    await prisma.order.update({
      where: { id: orderId },
      data: {
        delivered: true,
        deliveredAt: new Date(),
        lastDeliveryError: null,
        deliveryAttempts: { increment: 1 },
      },
    });
    logger.info({ orderId, qty: order.qty, platform: order.platform }, "Order delivered");

    // Sales notif untuk owner — best-effort, tidak block kalau gagal
    void notifyOwner(
      [
        `*Penjualan baru!*`,
        `Order: \`${order.id}\``,
        `Produk: ${order.product.name} x${order.qty}`,
        `Total: Rp${order.totalAmount?.toLocaleString("id-ID")}`,
        `Pembeli: ${order.username ?? order.chatId} (${order.platform})`,
      ].join("\n"),
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryAttempts: { increment: 1 },
        lastDeliveryError: msg.slice(0, 500),
      },
    });
    logger.error({ err, orderId }, "Gagal kirim DM ke user (stok sudah di-allocate, bisa retry)");

    // Alert owner — pakai attempt baru
    void notifyOwner(
      [
        `*Delivery GAGAL — order ${order.id}*`,
        `Produk: ${order.product.name} x${order.qty}`,
        `Pembeli: ${order.username ?? order.chatId} (${order.platform})`,
        `Percobaan ke-${updated.deliveryAttempts}`,
        `Error: \`${msg.slice(0, 200)}\``,
        ``,
        `Stok sudah ter-allocate. Cek dashboard /admin/orders untuk redeliver.`,
      ].join("\n"),
    );

    throw err;
  }
}

async function allocateStock(orderId: string, productId: string, qty: number): Promise<string[]> {
  return prisma.$transaction(async (db) => {
    const payloads: string[] = [];
    for (let i = 0; i < qty; i++) {
      const stock = await db.stock.findFirst({
        where: { productId, used: false },
        orderBy: { id: "asc" },
      });
      if (!stock) {
        throw new Error(`Stok ${productId} habis saat delivery (order ${orderId})`);
      }
      await db.stock.update({
        where: { id: stock.id },
        data: { used: true, usedAt: new Date(), orderId },
      });
      payloads.push(stock.payload);
    }
    await db.order.update({
      where: { id: orderId },
      data: { deliveryPayload: JSON.stringify(payloads) },
    });
    return payloads;
  });
}

async function sendToUser(platform: string, chatId: string, message: string): Promise<void> {
  if (platform === "TELEGRAM") {
    const bot = registry.telegram;
    if (!bot) throw new Error("Telegram bot tidak running");
    await bot.api.sendMessage(chatId, message, { parse_mode: "Markdown" });
  } else if (platform === "DISCORD") {
    const client = registry.discord;
    if (!client) throw new Error("Discord bot tidak running");
    const user = await client.users.fetch(chatId);
    await user.send(message);
  } else {
    throw new Error(`Platform ${platform} tidak didukung`);
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
