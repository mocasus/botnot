import {
  AttachmentBuilder,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { config } from "../config.js";
import { logger } from "../logger.js";
import { listProducts } from "../products/catalog.js";
import { createOrder } from "../orders/service.js";
import { registry } from "./registry.js";
import {
  adminCommandDefinitions,
  handleAdminCommand,
  isAdminCommand,
} from "./discord-admin.js";

export async function startDiscordBot(): Promise<void> {
  if (!config.DISCORD_BOT_TOKEN || !config.DISCORD_CLIENT_ID) {
    logger.warn("DISCORD_BOT_TOKEN/CLIENT_ID tidak diset, skip Discord bot");
    return;
  }

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages],
  });

  // User commands
  const userCommands = [
    new SlashCommandBuilder()
      .setName("catalog")
      .setDescription("Lihat daftar produk")
      .toJSON(),
    new SlashCommandBuilder()
      .setName("buy")
      .setDescription("Beli produk")
      .addStringOption((o) =>
        o.setName("product_id").setDescription("ID produk").setRequired(true),
      )
      .addIntegerOption((o) =>
        o.setName("qty").setDescription("Jumlah (default 1)").setMinValue(1),
      )
      .toJSON(),
  ];

  const commands = [...userCommands, ...adminCommandDefinitions];

  // Register commands (guild = instan, global = bisa sampai 1 jam propagasi)
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
    if (!interaction.isChatInputCommand()) return;
    try {
      if (isAdminCommand(interaction.commandName)) {
        await handleAdminCommand(interaction);
        return;
      }
      if (interaction.commandName === "catalog") {
        await handleCatalog(interaction);
      } else if (interaction.commandName === "buy") {
        await handleBuy(interaction);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      logger.error({ err, cmd: interaction.commandName }, "Discord command error");
      const reply = { content: `Error: ${msg}`, ephemeral: true };
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(reply).catch(() => {});
      } else {
        await interaction.reply(reply).catch(() => {});
      }
    }
  });

  client.once(Events.ClientReady, (c) =>
    logger.info({ tag: c.user.tag }, "Discord bot ready"),
  );

  registry.discord = client;
  await client.login(config.DISCORD_BOT_TOKEN);
}

async function handleCatalog(i: ChatInputCommandInteraction): Promise<void> {
  await i.deferReply({ ephemeral: true });
  const products = await listProducts();
  if (products.length === 0) {
    await i.editReply("Belum ada produk tersedia.");
    return;
  }
  const embed = new EmbedBuilder().setTitle("Katalog Produk").setColor(0x5865f2);
  for (const p of products) {
    embed.addFields({
      name: `${p.name} (${p.id})`,
      value: [
        p.description ?? "",
        `Harga: **Rp${p.priceIDR.toLocaleString("id-ID")}**`,
        `Stok: ${p.availableStock}`,
      ]
        .filter(Boolean)
        .join("\n"),
    });
  }
  await i.editReply({
    content: "Beli dengan `/buy product_id:<id>`",
    embeds: [embed],
  });
}

async function handleBuy(i: ChatInputCommandInteraction): Promise<void> {
  await i.deferReply({ ephemeral: true });
  const productId = i.options.getString("product_id", true);
  const qty = i.options.getInteger("qty") ?? 1;

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
      "Scan QRIS di lampiran untuk bayar.\nProduk akan dikirim otomatis ke DM kamu setelah lunas.",
    )
    .addFields(
      {
        name: "Total",
        value: `Rp${order.totalAmount?.toLocaleString("id-ID")}`,
        inline: true,
      },
      { name: "Berlaku sampai", value: `${tx.expired_at} WIB`, inline: true },
    )
    .setImage(`attachment://${fileName}`);

  await i.editReply({ embeds: [embed], files: [attachment] });
}

function decodeBase64Image(dataUrl: string): Buffer {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
  return Buffer.from(base64, "base64");
}
