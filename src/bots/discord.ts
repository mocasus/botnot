import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  ComponentType,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type Interaction,
  type StringSelectMenuInteraction,
} from "discord.js";
import { config } from "../config.js";
import { logger } from "../logger.js";
import { prisma } from "../db.js";
import { listProducts } from "../products/catalog.js";
import { createOrder } from "../orders/service.js";
import { registry } from "./registry.js";
import {
  adminCommandDefinitions,
  handleAdminCommand,
  isAdminCommand,
} from "./discord-admin.js";
import { discordRole } from "../admin/auth.js";
import { notifyOwner } from "../admin/owner.js";

/**
 * Component customId formats:
 *   prod-select         → string select menu pilih produk
 *   buy:<id>:<qty>      → tombol beli
 *   status:<orderId>    → cek status order
 *   menu:catalog        → buka katalog
 */

export async function startDiscordBot(): Promise<void> {
  if (!config.DISCORD_BOT_TOKEN || !config.DISCORD_CLIENT_ID) {
    logger.warn("DISCORD_BOT_TOKEN/CLIENT_ID tidak diset, skip Discord bot");
    return;
  }

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages],
  });

  const userCommands = [
    new SlashCommandBuilder()
      .setName("catalog")
      .setDescription("Lihat daftar produk dan beli")
      .toJSON(),
    new SlashCommandBuilder()
      .setName("buy")
      .setDescription("Beli produk langsung (power user)")
      .addStringOption((o) =>
        o.setName("product_id").setDescription("ID produk").setRequired(true),
      )
      .addIntegerOption((o) =>
        o.setName("qty").setDescription("Jumlah (default 1)").setMinValue(1),
      )
      .toJSON(),
    new SlashCommandBuilder()
      .setName("whoami")
      .setDescription("Cek role kamu (owner / admin / customer)")
      .toJSON(),
  ];

  const commands = [...userCommands, ...adminCommandDefinitions];
  const rest = new REST({ version: "10" }).setToken(config.DISCORD_BOT_TOKEN);
  const route = config.DISCORD_GUILD_ID
    ? Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, config.DISCORD_GUILD_ID)
    : Routes.applicationCommands(config.DISCORD_CLIENT_ID);
  await rest.put(route, { body: commands });
  logger.info(
    { scope: config.DISCORD_GUILD_ID ? "guild" : "global", count: commands.length },
    "Discord slash commands registered",
  );

  client.on(Events.InteractionCreate, async (interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        await handleSlashCommand(interaction);
      } else if (interaction.isStringSelectMenu()) {
        await handleSelectMenu(interaction);
      } else if (interaction.isButton()) {
        await handleButton(interaction);
      }
    } catch (err) {
      await replyError(interaction, err);
    }
  });

  client.once(Events.ClientReady, (c) => {
    logger.info({ tag: c.user.tag }, "Discord bot ready");
    if (config.OWNER_DISCORD_ID) {
      void notifyOwner(
        [
          `**Bot Online**`,
          ``,
          `Discord bot ${c.user.tag} siap menerima order.`,
          ``,
          `Cek \`/catalog\` untuk lihat produk, atau \`/admin-stats\` untuk admin overview.`,
        ].join("\n"),
      );
    }
  });

  registry.discord = client;
  await client.login(config.DISCORD_BOT_TOKEN);
}

// ============ Routers ============

async function handleSlashCommand(i: ChatInputCommandInteraction): Promise<void> {
  if (isAdminCommand(i.commandName)) {
    await handleAdminCommand(i);
    return;
  }
  if (i.commandName === "catalog") return showCatalog(i);
  if (i.commandName === "buy") return handleBuyCommand(i);
  if (i.commandName === "whoami") return handleWhoami(i);
}

async function handleSelectMenu(i: StringSelectMenuInteraction): Promise<void> {
  if (i.customId === "prod-select") {
    const productId = i.values[0];
    if (productId) await showProductDetail(i, productId);
  }
}

async function handleButton(i: ButtonInteraction): Promise<void> {
  const id = i.customId;
  if (id === "menu:catalog") return showCatalog(i);
  if (id.startsWith("buy:")) {
    const [, productId, qtyStr] = id.split(":");
    if (productId && qtyStr) await executeBuy(i, productId, parseInt(qtyStr, 10) || 1);
    return;
  }
  if (id.startsWith("status:")) {
    const orderId = id.slice("status:".length);
    return showStatus(i, orderId);
  }
}

// ============ Renderers ============

type AnyInteraction =
  | ChatInputCommandInteraction
  | ButtonInteraction
  | StringSelectMenuInteraction;

async function showCatalog(i: AnyInteraction): Promise<void> {
  if (i.isChatInputCommand() || i.isButton()) {
    if (!i.deferred && !i.replied) await i.deferReply({ ephemeral: true });
  }
  const products = await listProducts();

  if (products.length === 0) {
    await replyOrEdit(i, { content: "Belum ada produk tersedia.", embeds: [], components: [] });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle("📦 Katalog Produk")
    .setColor(0x22d3ee)
    .setDescription(`Pilih produk dari menu di bawah untuk lihat detail dan beli.\n\n${products.length} produk tersedia.`);

  for (const p of products.slice(0, 25)) {
    embed.addFields({
      name: `${p.name} · Rp${p.priceIDR.toLocaleString("id-ID")}`,
      value: `\`${p.id}\` · Stok: ${p.availableStock}${p.description ? ` · ${p.description.slice(0, 60)}` : ""}`,
    });
  }

  // Discord select menu max 25 options
  const select = new StringSelectMenuBuilder()
    .setCustomId("prod-select")
    .setPlaceholder("Pilih produk untuk beli…")
    .addOptions(
      products.slice(0, 25).map((p) => ({
        label: `${p.name}`.slice(0, 100),
        description: `Rp${p.priceIDR.toLocaleString("id-ID")} · Stok ${p.availableStock}`.slice(0, 100),
        value: p.id,
      })),
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  await replyOrEdit(i, { content: "", embeds: [embed], components: [row] });
}

async function showProductDetail(i: StringSelectMenuInteraction, productId: string): Promise<void> {
  await i.deferUpdate().catch(() => {});

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    await i.followUp({ content: "Produk tidak ditemukan.", ephemeral: true });
    return;
  }
  const available = await prisma.stock.count({ where: { productId, used: false } });

  const embed = new EmbedBuilder()
    .setTitle(product.name)
    .setColor(0xa78bfa)
    .setDescription(product.description ?? "")
    .addFields(
      { name: "Harga", value: `**Rp${product.priceIDR.toLocaleString("id-ID")}**`, inline: true },
      { name: "Stok", value: String(available), inline: true },
      { name: "Tipe", value: product.type, inline: true },
      { name: "ID", value: `\`${product.id}\``, inline: false },
    );

  const row = new ActionRowBuilder<ButtonBuilder>();
  if (available > 0) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`buy:${product.id}:1`)
        .setLabel("Beli 1")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🛒"),
    );
    if (available >= 3) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`buy:${product.id}:3`)
          .setLabel("Beli 3")
          .setStyle(ButtonStyle.Primary),
      );
    }
    if (available >= 5) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`buy:${product.id}:5`)
          .setLabel("Beli 5")
          .setStyle(ButtonStyle.Primary),
      );
    }
  } else {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`buy:${product.id}:0`)
        .setLabel("Stok habis")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
    );
  }
  row.addComponents(
    new ButtonBuilder().setCustomId("menu:catalog").setLabel("← Katalog").setStyle(ButtonStyle.Secondary),
  );

  await i.editReply({ content: "", embeds: [embed], components: [row] });
}

async function executeBuy(i: ButtonInteraction, productId: string, qty: number): Promise<void> {
  if (qty <= 0) return;
  await i.deferReply({ ephemeral: true });

  try {
    const { order, tx } = await createOrder({
      productId,
      qty,
      platform: "DISCORD",
      chatId: i.user.id,
      username: i.user.username,
    });

    const buffer = decodeBase64Image(tx.qris_image);
    const fileName = `${order.id}.png`;
    const attachment = new AttachmentBuilder(buffer, { name: fileName });

    const embed = new EmbedBuilder()
      .setTitle(`Order ${order.id}`)
      .setColor(0xfaa61a)
      .setDescription(
        "Scan QRIS di lampiran untuk bayar.\nProduk dikirim otomatis ke DM kamu setelah pembayaran terkonfirmasi.",
      )
      .addFields(
        { name: "Total", value: `**Rp${order.totalAmount?.toLocaleString("id-ID")}**`, inline: true },
        { name: "Berlaku sampai", value: `${tx.expired_at} WIB`, inline: true },
      )
      .setImage(`attachment://${fileName}`);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`status:${order.id}`)
        .setLabel("Cek Status")
        .setStyle(ButtonStyle.Success)
        .setEmoji("🔄"),
      new ButtonBuilder()
        .setCustomId("menu:catalog")
        .setLabel("← Katalog")
        .setStyle(ButtonStyle.Secondary),
    );

    await i.editReply({ embeds: [embed], files: [attachment], components: [row] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    logger.error({ err, productId, qty }, "Discord buy failed");
    await i.editReply({ content: `❌ Gagal membuat order: ${msg}` });
  }
}

async function showStatus(i: ButtonInteraction, orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { product: true },
  });
  if (!order) {
    await i.reply({ content: "Order tidak ditemukan.", ephemeral: true });
    return;
  }
  const colors: Record<string, number> = {
    PENDING: 0xfaa61a,
    PAID: 0x57f287,
    EXPIRED: 0xed4245,
  };
  const msg =
    order.status === "PAID" && order.delivered
      ? "✓ Order sudah dibayar dan produk sudah terkirim."
      : order.status === "PAID"
        ? "Order sudah dibayar, sedang dikirim…"
        : order.status === "EXPIRED"
          ? "Order sudah expired. Silakan order baru."
          : "Order masih PENDING. Silakan scan QRIS untuk bayar.";

  const embed = new EmbedBuilder()
    .setTitle(`Status Order`)
    .setColor(colors[order.status] ?? 0x5865f2)
    .setDescription(msg)
    .addFields(
      { name: "Order ID", value: `\`${order.id}\``, inline: false },
      { name: "Status", value: order.status, inline: true },
      { name: "Total", value: `Rp${order.totalAmount?.toLocaleString("id-ID")}`, inline: true },
    );
  await i.reply({ embeds: [embed], ephemeral: true });
}

async function handleBuyCommand(i: ChatInputCommandInteraction): Promise<void> {
  await i.deferReply({ ephemeral: true });
  const productId = i.options.getString("product_id", true);
  const qty = i.options.getInteger("qty") ?? 1;

  try {
    const { order, tx } = await createOrder({
      productId,
      qty,
      platform: "DISCORD",
      chatId: i.user.id,
      username: i.user.username,
    });

    const buffer = decodeBase64Image(tx.qris_image);
    const fileName = `${order.id}.png`;
    const attachment = new AttachmentBuilder(buffer, { name: fileName });

    const embed = new EmbedBuilder()
      .setTitle(`Order ${order.id}`)
      .setColor(0xfaa61a)
      .setDescription("Scan QRIS untuk bayar. Produk dikirim otomatis ke DM setelah lunas.")
      .addFields(
        { name: "Total", value: `**Rp${order.totalAmount?.toLocaleString("id-ID")}**`, inline: true },
        { name: "Berlaku sampai", value: `${tx.expired_at} WIB`, inline: true },
      )
      .setImage(`attachment://${fileName}`);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`status:${order.id}`)
        .setLabel("Cek Status")
        .setStyle(ButtonStyle.Success)
        .setEmoji("🔄"),
    );
    await i.editReply({ embeds: [embed], files: [attachment], components: [row] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    await i.editReply({ content: `❌ Gagal membuat order: ${msg}` });
  }
}

async function handleWhoami(i: ChatInputCommandInteraction): Promise<void> {
  const role = discordRole(i.user.id);
  const labels: Record<typeof role, string> = {
    owner: "👑 Owner",
    admin: "🛡️ Admin",
    customer: "👤 Customer",
  };
  const colors: Record<typeof role, number> = {
    owner: 0xfaa61a,
    admin: 0xa78bfa,
    customer: 0x5865f2,
  };
  const extra =
    role === "owner"
      ? "Kamu primary admin. Otomatis dapat notifikasi event penting."
      : role === "admin"
        ? "Kamu admin. Pakai `/admin-stats` untuk overview."
        : "Klik `/catalog` untuk lihat produk yang dijual.";

  const embed = new EmbedBuilder()
    .setTitle(`Role: ${labels[role]}`)
    .setColor(colors[role])
    .setDescription(extra)
    .addFields(
      { name: "User ID", value: `\`${i.user.id}\``, inline: true },
      { name: "Username", value: i.user.username, inline: true },
    );
  await i.reply({ embeds: [embed], ephemeral: true });
}

// ============ Helpers ============

async function replyOrEdit(
  i: AnyInteraction,
  payload: { content?: string; embeds?: EmbedBuilder[]; components?: ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[] },
): Promise<void> {
  // Cast karena tipe ActionRowBuilder generik
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = payload as any;
  if (i.deferred || i.replied) {
    await i.editReply(p);
  } else {
    await i.reply({ ...p, ephemeral: true });
  }
}

async function replyError(interaction: Interaction, err: unknown): Promise<void> {
  const msg = err instanceof Error ? err.message : "Unknown error";
  logger.error({ err }, "Discord interaction error");
  if (!interaction.isRepliable()) return;
  const reply = { content: `❌ Error: ${msg}`, ephemeral: true } as const;
  if (interaction.deferred || interaction.replied) {
    await interaction.followUp(reply).catch(() => {});
  } else {
    await interaction.reply(reply).catch(() => {});
  }
}

function decodeBase64Image(dataUrl: string): Buffer {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
  return Buffer.from(base64, "base64");
}

// ComponentType import marker (untuk satisfy lint kalau gak terpakai langsung)
void ComponentType;
