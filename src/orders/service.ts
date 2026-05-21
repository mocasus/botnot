import { prisma } from "../db.js";
import { logger } from "../logger.js";
import { createTransaction, parseRupiah, parseWIBDate, type CreateTxData } from "../payment/klikqris.js";
import { getProduct } from "../products/catalog.js";

export type Platform = "TELEGRAM" | "DISCORD";

export async function createOrder(params: {
  productId: string;
  qty: number;
  platform: Platform;
  chatId: string;
  username?: string;
}): Promise<{ order: Awaited<ReturnType<typeof prisma.order.create>>; tx: CreateTxData }> {
  const product = await getProduct(params.productId);
  if (!product || !product.active) {
    throw new Error(`Produk "${params.productId}" tidak ditemukan / nonaktif`);
  }

  const stockCount = await prisma.stock.count({
    where: { productId: product.id, used: false },
  });
  if (stockCount < params.qty) {
    throw new Error(`Stok tidak cukup. Tersedia: ${stockCount}, diminta: ${params.qty}`);
  }

  const amount = product.priceIDR * params.qty;
  const orderId = generateOrderId();

  const tx = await createTransaction({
    orderId,
    amount,
    keterangan: `${product.name} x${params.qty} (${params.platform})`,
  });

  const order = await prisma.order.create({
    data: {
      id: orderId,
      productId: product.id,
      qty: params.qty,
      amount,
      totalAmount: parseRupiah(tx.total_amount),
      signature: tx.signature,
      qrisUrl: tx.qris_url,
      status: "PENDING",
      platform: params.platform,
      chatId: params.chatId,
      username: params.username,
      expiredAt: parseWIBDate(tx.expired_at),
    },
  });

  logger.info(
    { orderId, platform: params.platform, productId: product.id, total: order.totalAmount },
    "Order created",
  );
  return { order, tx };
}

function generateOrderId() {
  const ts = Date.now().toString();
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `INV-${ts}-${rand}`;
}

/**
 * Tandai order PAID secara idempoten.
 * Return alreadyPaid=true kalau sudah PAID sebelumnya.
 */
export async function markOrderPaid(
  orderId: string,
  paidAt?: Date,
): Promise<{ alreadyPaid: boolean; orderId: string } | null> {
  return prisma.$transaction(async (db) => {
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) return null;
    if (order.status === "PAID") {
      return { alreadyPaid: true, orderId };
    }
    await db.order.update({
      where: { id: orderId },
      data: { status: "PAID", paidAt: paidAt ?? new Date() },
    });
    return { alreadyPaid: false, orderId };
  });
}

export async function markOrderExpired(orderId: string): Promise<void> {
  await prisma.order.updateMany({
    where: { id: orderId, status: "PENDING" },
    data: { status: "EXPIRED" },
  });
}
