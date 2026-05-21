import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Contoh produk: akun Netflix
  const netflix = await prisma.product.upsert({
    where: { id: "NETFLIX-1B" },
    update: {},
    create: {
      id: "NETFLIX-1B",
      name: "Netflix Premium 1 Bulan",
      description: "Akun sharing 1 profil. Garansi 30 hari.",
      priceIDR: 25000,
      type: "ACCOUNT",
    },
  });

  // Contoh produk: license key
  const license = await prisma.product.upsert({
    where: { id: "WIN11-PRO" },
    update: {},
    create: {
      id: "WIN11-PRO",
      name: "Windows 11 Pro License",
      description: "Genuine retail key, lifetime activation.",
      priceIDR: 75000,
      type: "LICENSE",
    },
  });

  // Tambah contoh stok kalau belum ada
  const existingStock = await prisma.stock.count({ where: { productId: netflix.id } });
  if (existingStock === 0) {
    await prisma.stock.createMany({
      data: [
        { productId: netflix.id, payload: "demo1@netflix.test | password123 | Profile: A" },
        { productId: netflix.id, payload: "demo2@netflix.test | password456 | Profile: B" },
        { productId: license.id, payload: "XXXXX-YYYYY-ZZZZZ-AAAAA-BBBBB" },
        { productId: license.id, payload: "11111-22222-33333-44444-55555" },
      ],
    });
  }

  console.log("Seed selesai.");
  console.log(" - Produk:", netflix.id, "&", license.id);
  console.log(" - Stok:", await prisma.stock.count(), "item");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
