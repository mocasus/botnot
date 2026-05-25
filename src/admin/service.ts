import { prisma } from "../db.js";
import { logger } from "../logger.js";
import { deliverOrder } from "../orders/delivery.js";

export interface AdminStats {
  totalOrders: number;
  pending: number;
  paid: number;
  expired: number;
  revenueToday: number;
  revenue7d: number;
  revenueAllTime: number;
  productsActive: number;
  stockAvailable: number;
}

export async function getStats(): Promise<AdminStats> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

  const [byStatus, todayAgg, weekAgg, allTimeAgg, productsActive, stockAvailable] =
    await Promise.all([
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: "PAID", paidAt: { gte: startOfToday } },
      }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: "PAID", paidAt: { gte: sevenDaysAgo } },
      }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: "PAID" },
      }),
      prisma.product.count({ where: { active: true } }),
      prisma.stock.count({ where: { used: false } }),
    ]);

  const counts = Object.fromEntries(byStatus.map((r) => [r.status, r._count._all]));
  const totalOrders = byStatus.reduce((acc, r) => acc + r._count._all, 0);

  return {
    totalOrders,
    pending: counts.PENDING ?? 0,
    paid: counts.PAID ?? 0,
    expired: counts.EXPIRED ?? 0,
    revenueToday: todayAgg._sum.totalAmount ?? 0,
    revenue7d: weekAgg._sum.totalAmount ?? 0,
    revenueAllTime: allTimeAgg._sum.totalAmount ?? 0,
    productsActive,
    stockAvailable,
  };
}

export async function listRecentOrders(opts?: { status?: string; take?: number }) {
  return prisma.order.findMany({
    where: opts?.status ? { status: opts.status } : undefined,
    include: { product: true },
    orderBy: { createdAt: "desc" },
    take: opts?.take ?? 20,
  });
}

export async function listProductsWithStock() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  const stockCounts = await prisma.stock.groupBy({
    by: ["productId", "used"],
    _count: { _all: true },
  });
  const map = new Map<string, { available: number; sold: number }>();
  for (const r of stockCounts) {
    const cur = map.get(r.productId) ?? { available: 0, sold: 0 };
    if (r.used) cur.sold += r._count._all;
    else cur.available += r._count._all;
    map.set(r.productId, cur);
  }
  return products.map((p) => ({
    ...p,
    available: map.get(p.id)?.available ?? 0,
    sold: map.get(p.id)?.sold ?? 0,
  }));
}

export async function createProduct(input: {
  id: string;
  name: string;
  priceIDR: number;
  description?: string;
  type?: string;
}) {
  if (!/^[A-Z0-9_-]+$/i.test(input.id)) {
    throw new Error("Product ID hanya boleh huruf, angka, underscore, dan tanda minus");
  }
  if (input.priceIDR <= 0) throw new Error("Harga harus > 0");
  return prisma.product.create({
    data: {
      id: input.id,
      name: input.name,
      priceIDR: input.priceIDR,
      description: input.description,
      type: input.type ?? "ACCOUNT",
    },
  });
}

export async function toggleProductActive(productId: string) {
  const p = await prisma.product.findUnique({ where: { id: productId } });
  if (!p) throw new Error("Produk tidak ditemukan");
  return prisma.product.update({
    where: { id: productId },
    data: { active: !p.active },
  });
}

/**
 * Tambah stok dalam batch. Skip baris kosong.
 * Return jumlah item yang berhasil ditambahkan.
 */
export async function addStock(productId: string, payloads: string[]): Promise<number> {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error(`Produk "${productId}" tidak ditemukan`);
  const cleaned = payloads.map((p) => p.trim()).filter(Boolean);
  if (cleaned.length === 0) return 0;
  await prisma.stock.createMany({
    data: cleaned.map((payload) => ({ productId, payload })),
  });
  logger.info({ productId, added: cleaned.length }, "Stock added");
  return cleaned.length;
}

export async function getStockForProduct(productId: string, opts?: { onlyAvailable?: boolean; take?: number }) {
  return prisma.stock.findMany({
    where: {
      productId,
      ...(opts?.onlyAvailable ? { used: false } : {}),
    },
    orderBy: { id: "desc" },
    take: opts?.take ?? 100,
  });
}

export async function redeliverOrder(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order tidak ditemukan");
  if (order.status !== "PAID") {
    throw new Error(`Tidak bisa redeliver — status order: ${order.status}`);
  }
  // Kalau sudah delivered, reset dulu supaya bisa kirim ulang.
  if (order.delivered) {
    await prisma.order.update({
      where: { id: orderId },
      data: { delivered: false },
    });
  }
  await deliverOrder(orderId);
}

export function formatIDR(amount: number | null | undefined): string {
  if (amount == null) return "-";
  return "Rp" + amount.toLocaleString("id-ID");
}
