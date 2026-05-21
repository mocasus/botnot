import { prisma } from "../db.js";

export async function listProducts() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  // hitung stok tersedia per produk
  const counts = await prisma.stock.groupBy({
    by: ["productId"],
    where: { used: false },
    _count: { _all: true },
  });
  const countMap = new Map(counts.map((c) => [c.productId, c._count._all]));

  return products.map((p) => ({
    ...p,
    availableStock: countMap.get(p.id) ?? 0,
  }));
}

export async function getProduct(id: string) {
  return prisma.product.findUnique({ where: { id } });
}

export async function getAvailableStockCount(productId: string) {
  return prisma.stock.count({ where: { productId, used: false } });
}
