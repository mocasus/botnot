import {
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { hasDiscordAdmins, isDiscordAdmin } from "../admin/auth.js";
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

/**
 * Slash command definitions untuk admin commands.
 * Pakai prefix `admin-` supaya gampang dibedakan dari user commands.
 */
export const adminCommandDefinitions = [
  new SlashCommandBuilder()
    .setName("admin-stats")
    .setDescription("[Admin] Statistik penjualan")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .toJSON(),

  new SlashCommandBuilder()
    .setName("admin-orders")
    .setDescription("[Admin] 10 order terakhir")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((o) =>
      o
        .setName("status")
        .setDescription("Filter status")
        .addChoices(
          { name: "Pending", value: "PENDING" },
          { name: "Paid", value: "PAID" },
          { name: "Expired", value: "EXPIRED" },
        ),
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName("admin-products")
    .setDescription("[Admin] Daftar produk + stok")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .toJSON(),

  new SlashCommandBuilder()
    .setName("admin-add-product")
    .setDescription("[Admin] Tambah produk baru")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((o) =>
      o.setName("id").setDescription("ID produk (contoh: NETFLIX-1B)").setRequired(true),
    )
    .addStringOption((o) =>
      o.setName("name").setDescription("Nama produk").setRequired(true),
    )
    .addIntegerOption((o) =>
      o.setName("price").setDescription("Harga IDR").setRequired(true).setMinValue(1),
    )
    .addStringOption((o) =>
      o.setName("description").setDescription("Deskripsi (opsional)"),
    )
    .addStringOption((o) =>
      o
        .setName("type")
        .setDescription("Tipe produk")
        .addChoices(
          { name: "Account", value: "ACCOUNT" },
          { name: "License", value: "LICENSE" },
          { name: "Voucher", value: "VOUCHER" },
          { name: "File", value: "FILE" },
          { name: "Other", value: "OTHER" },
        ),
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName("admin-add-stock")
    .setDescription("[Admin] Tambah stok untuk produk")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((o) =>
      o.setName("product_id").setDescription("ID produk").setRequired(true),
    )
    .addStringOption((o) =>
      o
        .setName("payloads")
        .setDescription("Payloads, pisahkan dengan || (contoh: a||b||c)")
        .setRequired(true),
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName("admin-toggle")
    .setDescription("[Admin] Aktifkan/nonaktifkan produk")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((o) =>
      o.setName("product_id").setDescription("ID produk").setRequired(true),
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName("admin-redeliver")
    .setDescription("[Admin] Kirim ulang produk untuk order tertentu")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((o) =>
      o.setName("order_id").setDescription("ID order").setRequired(true),
    )
    .toJSON(),
];

const ADMIN_COMMAND_NAMES = new Set(adminCommandDefinitions.map((c) => c.name));

export function isAdminCommand(name: string): boolean {
  return ADMIN_COMMAND_NAMES.has(name);
}

export async function handleAdminCommand(i: ChatInputCommandInteraction): Promise<void> {
  // Layer-1: cek di-CSV ADMIN_DISCORD_IDS — independen dari role server.
  if (!hasDiscordAdmins() || !isDiscordAdmin(i.user.id)) {
    await i.reply({
      content: "Akses ditolak. Kamu bukan admin yang terdaftar.",
      ephemeral: true,
    });
    return;
  }

  await i.deferReply({ ephemeral: true });
  try {
    switch (i.commandName) {
      case "admin-stats":
        await handleStats(i);
        return;
      case "admin-orders":
        await handleOrders(i);
        return;
      case "admin-products":
        await handleProducts(i);
        return;
      case "admin-add-product":
        await handleAddProduct(i);
        return;
      case "admin-add-stock":
        await handleAddStock(i);
        return;
      case "admin-toggle":
        await handleToggle(i);
        return;
      case "admin-redeliver":
        await handleRedeliver(i);
        return;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    logger.error({ err, cmd: i.commandName }, "Discord admin command error");
    await i.editReply({ content: `Error: ${msg}` });
  }
}

async function handleStats(i: ChatInputCommandInteraction) {
  const s = await getStats();
  const embed = new EmbedBuilder()
    .setTitle("Statistik Toko")
    .setColor(0x22d3ee)
    .addFields(
      { name: "Revenue Hari Ini", value: formatIDR(s.revenueToday), inline: true },
      { name: "Revenue 7 Hari", value: formatIDR(s.revenue7d), inline: true },
      { name: "Revenue Total", value: formatIDR(s.revenueAllTime), inline: true },
      { name: "Pending", value: String(s.pending), inline: true },
      { name: "Paid", value: String(s.paid), inline: true },
      { name: "Expired", value: String(s.expired), inline: true },
      { name: "Produk Aktif", value: String(s.productsActive), inline: true },
      { name: "Stok Tersedia", value: String(s.stockAvailable), inline: true },
      { name: "Total Order", value: String(s.totalOrders), inline: true },
    );
  await i.editReply({ embeds: [embed] });
}

async function handleOrders(i: ChatInputCommandInteraction) {
  const status = i.options.getString("status") ?? undefined;
  const orders = await listRecentOrders({ status, take: 10 });
  if (orders.length === 0) {
    await i.editReply(`Belum ada order${status ? ` dengan status ${status}` : ""}.`);
    return;
  }
  const lines = orders.map((o) => {
    const flag = o.delivered ? "✓" : o.status === "PAID" ? "⚠" : " ";
    const time = o.createdAt.toISOString().slice(5, 16).replace("T", " ");
    return `${flag} \`${o.id}\` · ${o.product.name} x${o.qty} · ${formatIDR(o.totalAmount)} · ${o.status} · ${o.platform} · ${time}`;
  });
  await i.editReply({
    content: `**Order Terbaru${status ? ` (${status})` : ""}**\n\n${lines.join("\n")}`,
  });
}

async function handleProducts(i: ChatInputCommandInteraction) {
  const products = await listProductsWithStock();
  if (products.length === 0) {
    await i.editReply("Belum ada produk.");
    return;
  }
  const embed = new EmbedBuilder().setTitle("Daftar Produk").setColor(0xa78bfa);
  for (const p of products) {
    embed.addFields({
      name: `${p.name} (${p.id}) ${p.active ? "" : "[NONAKTIF]"}`,
      value: `${formatIDR(p.priceIDR)} · stok: ${p.available}/${p.available + p.sold}`,
    });
  }
  await i.editReply({ embeds: [embed] });
}

async function handleAddProduct(i: ChatInputCommandInteraction) {
  const id = i.options.getString("id", true);
  const name = i.options.getString("name", true);
  const priceIDR = i.options.getInteger("price", true);
  const description = i.options.getString("description") ?? undefined;
  const type = i.options.getString("type") ?? undefined;
  const product = await createProduct({ id, name, priceIDR, description, type });
  await i.editReply(
    `Produk **${product.name}** (\`${product.id}\`) berhasil dibuat.\nTambah stok dengan \`/admin-add-stock product_id:${product.id} payloads:...\``,
  );
}

async function handleAddStock(i: ChatInputCommandInteraction) {
  const productId = i.options.getString("product_id", true);
  const raw = i.options.getString("payloads", true);
  // Discord slash input single-line; pisahkan dengan ||
  const payloads = raw.split("||").map((s) => s.trim()).filter(Boolean);
  if (payloads.length === 0) {
    await i.editReply("Tidak ada payload yang valid. Pisahkan dengan `||`.");
    return;
  }
  const added = await addStock(productId, payloads);
  await i.editReply(`**${added}** item stok berhasil ditambahkan untuk \`${productId}\`.`);
}

async function handleToggle(i: ChatInputCommandInteraction) {
  const productId = i.options.getString("product_id", true);
  const p = await toggleProductActive(productId);
  await i.editReply(`Produk **${p.name}** sekarang ${p.active ? "AKTIF" : "NONAKTIF"}.`);
}

async function handleRedeliver(i: ChatInputCommandInteraction) {
  const orderId = i.options.getString("order_id", true);
  await redeliverOrder(orderId);
  await i.editReply(`Order \`${orderId}\` berhasil dikirim ulang.`);
}
