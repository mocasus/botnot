import { prisma } from "../db.js";

/**
 * Analytics queries untuk dashboard /admin/analytics.
 * Pakai raw SQL kalau perlu untuk performa, tapi default Prisma groupBy/aggregate.
 */

export interface AnalyticsData {
  revenueByDay: Array<{ date: string; revenue: number; orders: number }>;
  topProducts: Array<{ productId: string; name: string; revenue: number; sold: number }>;
  byStatus: Array<{ status: string; count: number }>;
  byPlatform: Array<{ platform: string; count: number; revenue: number }>;
  totals: {
    revenueAllTime: number;
    revenue30d: number;
    orders30d: number;
    avgOrderValue: number;
    deliveryFailureRate: number; // 0..1
  };
}

export async function getAnalytics(): Promise<AnalyticsData> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

  // === Revenue by day (30 hari terakhir) ===
  const paidOrders = await prisma.order.findMany({
    where: { status: "PAID", paidAt: { gte: thirtyDaysAgo } },
    select: { paidAt: true, totalAmount: true, productId: true },
    orderBy: { paidAt: "asc" },
  });

  const dayMap = new Map<string, { revenue: number; orders: number }>();
  // pre-fill 30 hari biar gap di chart kelihatan sebagai 0
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
    const key = dateKey(d);
    dayMap.set(key, { revenue: 0, orders: 0 });
  }
  for (const o of paidOrders) {
    if (!o.paidAt) continue;
    const key = dateKey(o.paidAt);
    const cur = dayMap.get(key) ?? { revenue: 0, orders: 0 };
    cur.revenue += o.totalAmount ?? 0;
    cur.orders += 1;
    dayMap.set(key, cur);
  }
  const revenueByDay = Array.from(dayMap.entries()).map(([date, v]) => ({
    date,
    revenue: v.revenue,
    orders: v.orders,
  }));

  // === Top products (all-time, by revenue) ===
  const topProductsRaw = await prisma.order.groupBy({
    by: ["productId"],
    where: { status: "PAID" },
    _sum: { totalAmount: true, qty: true },
    _count: { _all: true },
    orderBy: { _sum: { totalAmount: "desc" } },
    take: 10,
  });
  const productMap = new Map(
    (
      await prisma.product.findMany({
        where: { id: { in: topProductsRaw.map((p) => p.productId) } },
        select: { id: true, name: true },
      })
    ).map((p) => [p.id, p.name]),
  );
  const topProducts = topProductsRaw.map((p) => ({
    productId: p.productId,
    name: productMap.get(p.productId) ?? p.productId,
    revenue: p._sum.totalAmount ?? 0,
    sold: p._sum.qty ?? 0,
  }));

  // === Status breakdown ===
  const statusGroups = await prisma.order.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const byStatus = statusGroups.map((s) => ({
    status: s.status,
    count: s._count._all,
  }));

  // === Platform breakdown (PAID only) ===
  const platformGroups = await prisma.order.groupBy({
    by: ["platform"],
    where: { status: "PAID" },
    _count: { _all: true },
    _sum: { totalAmount: true },
  });
  const byPlatform = platformGroups.map((p) => ({
    platform: p.platform,
    count: p._count._all,
    revenue: p._sum.totalAmount ?? 0,
  }));

  // === Totals ===
  const allTimePaid = await prisma.order.aggregate({
    where: { status: "PAID" },
    _sum: { totalAmount: true },
    _count: { _all: true },
    _avg: { totalAmount: true },
  });
  const last30d = await prisma.order.aggregate({
    where: { status: "PAID", paidAt: { gte: thirtyDaysAgo } },
    _sum: { totalAmount: true },
    _count: { _all: true },
  });
  const failedDeliveries = await prisma.order.count({
    where: { status: "PAID", delivered: false, deliveryAttempts: { gt: 0 } },
  });
  const totalPaidCount = allTimePaid._count._all || 0;

  const totals = {
    revenueAllTime: allTimePaid._sum.totalAmount ?? 0,
    revenue30d: last30d._sum.totalAmount ?? 0,
    orders30d: last30d._count._all ?? 0,
    avgOrderValue: Math.round(allTimePaid._avg.totalAmount ?? 0),
    deliveryFailureRate: totalPaidCount === 0 ? 0 : failedDeliveries / totalPaidCount,
  };

  return { revenueByDay, topProducts, byStatus, byPlatform, totals };
}

function dateKey(d: Date): string {
  // YYYY-MM-DD (UTC) — dipakai sebagai bucket key, urut alphabetically = urut by date
  return d.toISOString().slice(0, 10);
}
