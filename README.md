<p align="center">
  <img src="./assets/logo.svg" alt="botnot" width="720">
</p>

<p align="center">
  <b>Bot auto-order untuk Telegram &amp; Discord, terintegrasi dengan <a href="https://klikqris.com">KlikQRIS</a> (QRIS Indonesia).</b><br>
  Pelanggan tinggal scan QR &mdash; produk dikirim otomatis lewat DM begitu pembayaran masuk.
</p>

<p align="center">
  <a href="#license"><img src="https://img.shields.io/badge/license-MIT-22c55e?style=flat-square" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/node-%3E%3D20.0.0-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node 20+">
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Prisma-5.x-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma">
  <img src="https://img.shields.io/badge/PRs-welcome-a78bfa?style=flat-square" alt="PRs welcome">
</p>

---

## Daftar Isi

- [Fitur](#fitur)
- [Cara Kerja](#cara-kerja)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Cara Dapat Kredensial](#cara-dapat-kredensial)
  - [Telegram Bot Token](#1-telegram-bot-token)
  - [Discord Bot Token](#2-discord-bot-token)
  - [KlikQRIS API Key](#3-klikqris-api-key)
- [Konfigurasi `.env`](#konfigurasi-env)
- [Webhook Public URL](#webhook-public-url)
- [Admin Dashboard](#admin-dashboard)
- [Admin Commands (Bot)](#admin-commands-bot)
- [Struktur Project](#struktur-project)
- [Perintah Bot](#perintah-bot)
- [Deploy ke Production](#deploy-ke-production)
- [Roadmap](#roadmap)
- [Kontribusi](#kontribusi)
- [License](#license)

---

## Fitur

- **Multi-platform**: Telegram + Discord dari satu codebase, satu database, satu webhook.
- **QRIS dinamis**: tiap order dapet QR unik via API KlikQRIS, scan pakai e-wallet apa pun (GoPay, OVO, Dana, ShopeePay, m-banking, dll).
- **Auto-deliver**: stok (akun, license key, voucher, file) otomatis dikirim ke DM pembeli setelah pembayaran terkonfirmasi.
- **Admin web dashboard**: kelola produk, stok, dan order dari browser. Login dengan username/password, signed cookie session.
- **Admin bot commands**: kelola toko langsung dari Telegram/Discord — tambah produk, restok, lihat orderan, kirim ulang produk yang gagal terkirim.
- **Idempotent webhook**: pengecekan status di DB mencegah kirim produk dobel kalau callback masuk berulang.
- **Signature validation**: webhook divalidasi dengan signature yang disimpan saat create transaction (anti fake-callback).
- **Stock management**: alokasi stok pakai DB transaction, anti race condition kalau dua orang beli barengan.
- **Retry-safe delivery**: kalau DM gagal terkirim, stok tetap teralokasi dan admin bisa kirim ulang dari dashboard tanpa double-claim stok.
- **Graceful degradation**: bot tetap jalan walau kredensial KlikQRIS belum diisi (cuma `/buy` yang gagal sampai diisi).
- **Configurable**: SQLite untuk dev, tinggal ganti `DATABASE_URL` ke Postgres untuk production.

## Cara Kerja

```
  ┌─────────────┐     ┌─────────────┐
  │  Telegram   │     │   Discord   │
  │  pelanggan  │     │  pelanggan  │
  └──────┬──────┘     └──────┬──────┘
         │ /buy <id>         │ /buy product_id:<id>
         ▼                   ▼
       ┌─────────────────────────┐
       │       botnot core       │
       │  (Fastify + grammy +    │
       │       discord.js)       │
       └────┬───────────────┬────┘
            │               │
            │ create        │ store order
            ▼               ▼
       ┌──────────┐    ┌──────────┐
       │ KlikQRIS │    │ Database │
       └────┬─────┘    └────▲─────┘
            │ webhook PAID   │ update + allocate stok
            └────────────────┘
                     │
                     ▼ DM pembeli
                ┌─────────┐
                │ Produk  │
                │ terkirim│
                └─────────┘
```

1. Pembeli ketik `/buy <product_id>` di Telegram atau Discord.
2. Bot panggil `/qris/create` ke KlikQRIS, simpan `signature` & `total_amount` di DB.
3. Bot kirim gambar QR + nominal + waktu kadaluarsa ke pembeli.
4. Pembeli scan QR, bayar pakai e-wallet apa pun.
5. KlikQRIS hit `POST /webhook/klikqris` di server kamu.
6. Webhook handler:
   1. Validasi signature.
   2. Cek idempotency (kalau sudah `PAID`, abaikan).
   3. Update status order ke `PAID`.
   4. Alokasi stok dalam DB transaction.
   5. Kirim produk lewat DM Telegram/Discord.

## Tech Stack

| Layer        | Tool                                        |
| ------------ | ------------------------------------------- |
| Runtime      | Node.js 20+ (ESM, NodeNext)                 |
| Bahasa       | TypeScript 5                                |
| Telegram bot | [grammy](https://grammy.dev)                |
| Discord bot  | [discord.js](https://discord.js.org) v14    |
| HTTP server  | [Fastify](https://fastify.dev) v5           |
| ORM          | [Prisma](https://www.prisma.io)             |
| DB           | SQLite (dev) / PostgreSQL (prod)            |
| Validasi env | [zod](https://zod.dev)                      |
| Logging      | [pino](https://getpino.io) + pino-pretty    |
| HTTP client  | axios                                       |

---

## Quick Start

> Butuh **Node.js 20+** dan **npm** (atau pnpm/yarn).

```bash
# 1. Clone repo
git clone https://github.com/mocasus/botnot.git
cd botnot

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env
# Edit .env, isi KLIKQRIS_*, TELEGRAM_BOT_TOKEN, DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID
# (panduan ada di section "Cara Dapat Kredensial" di bawah)

# 4. Setup database (SQLite, default ada di prisma/dev.db)
npm run db:push
npm run db:seed     # opsional: isi contoh produk

# 5. Jalanin (webhook + Telegram bot + Discord bot, satu proses)
npm run dev
```

Output kira-kira:

```
[12:34:56] INFO: Webhook server listening port=3000
[12:34:57] INFO: Telegram bot started username=botnot_bot
[12:34:58] INFO: Discord slash commands registered scope=guild
[12:34:58] INFO: Discord bot ready tag=botnot#1234
```

Buka chat Telegram dengan bot kamu, ketik `/start` &mdash; siap testing!

---

## Cara Dapat Kredensial

### 1. Telegram Bot Token

1. Buka aplikasi Telegram, search **`@BotFather`** dan mulai chat.
2. Kirim perintah: `/newbot`
3. BotFather minta 2 hal:
   - **Display name** (bebas, misal: `Toko Otomatis`)
   - **Username** (harus unik & diakhiri `bot`, misal: `tokootomatis_bot`)
4. BotFather balas dengan token format:
   ```
   123456789:ABCdefGhIJklmNOpqrSTUvwxYZ-1234567890
   ```
   Copy token ini ke `TELEGRAM_BOT_TOKEN` di `.env`.
5. **Opsional** &mdash; biar bot keliatan rapi:
   - `/setdescription` — deskripsi bot
   - `/setuserpic` — kirim gambar untuk avatar
   - `/setcommands` — daftar command yang muncul di tombol menu, contoh:
     ```
     start - Mulai
     catalog - Lihat daftar produk
     buy - Beli produk
     ```

### 2. Discord Bot Token

1. Buka **[Discord Developer Portal](https://discord.com/developers/applications)** dan login.
2. Klik **`New Application`**, kasih nama (misal: `Botnot`), klik **Create**.
3. Di sidebar pilih **`Bot`**:
   - Klik **`Reset Token`** &rarr; copy token-nya. **Token cuma muncul sekali!** Simpan ke `DISCORD_BOT_TOKEN`.
   - (Opsional) Matikan toggle **`Public Bot`** kalau bot ini private.
4. Di sidebar pilih **`General Information`**:
   - Copy **`Application ID`** &rarr; ini yang kita pakai sebagai `DISCORD_CLIENT_ID` di `.env`.
5. **Invite bot ke server kamu**:
   - Sidebar &rarr; **`OAuth2`** &rarr; **`URL Generator`**.
   - Centang scope: `bot`, `applications.commands`.
   - Centang Bot Permissions: `Send Messages`, `Embed Links`, `Attach Files`, `Use Slash Commands`.
   - Copy URL yang dihasilkan, buka di browser, pilih server, klik **Authorize**.
6. **Opsional &mdash; Guild ID untuk testing cepat**:
   - Slash command global butuh waktu propagasi sampai 1 jam. Untuk dev, daftarkan ke 1 guild aja biar instan.
   - Aktifkan Developer Mode: Discord &rarr; Settings &rarr; Advanced &rarr; **Developer Mode** ON.
   - Right-click icon server kamu &rarr; **Copy Server ID** &rarr; paste ke `DISCORD_GUILD_ID` di `.env`.
   - Untuk production, kosongkan `DISCORD_GUILD_ID` biar pakai global commands.

> **Catatan penting Discord:** bot hanya bisa kirim DM ke user yang **berbagi minimal satu server** dengan bot. Buat server "lobby" dan minta pelanggan join sebelum membeli, atau kirim hasil order ke channel publik dengan @mention sebagai fallback.

### 3. KlikQRIS API Key

1. Daftar/login akun merchant di **[klikqris.com](https://klikqris.com)**.
2. Buka dashboard merchant, copy:
   - `x-api-key` &rarr; isi ke `KLIKQRIS_API_KEY`
   - `id_merchant` &rarr; isi ke `KLIKQRIS_MERCHANT_ID`
3. Daftarkan **Webhook URL** kamu di dashboard, format:
   ```
   https://<domain-public-kamu>/webhook/klikqris
   ```
4. **JANGAN PERNAH** commit `.env` ke git. File `.gitignore` sudah meng-ignore `.env*` (kecuali `.env.example`).

---

## Konfigurasi `.env`

```bash
NODE_ENV=development
PORT=3000

# KlikQRIS — boleh dikosongkan untuk dev, /buy gagal sampai diisi
KLIKQRIS_API_BASE=https://klikqris.com/api
KLIKQRIS_API_KEY=          # x-api-key dari dashboard
KLIKQRIS_MERCHANT_ID=      # id_merchant

# Telegram — kosongkan untuk disable
TELEGRAM_BOT_TOKEN=        # dari @BotFather

# Discord — kosongkan untuk disable
DISCORD_BOT_TOKEN=         # dari Developer Portal > Bot
DISCORD_CLIENT_ID=         # = Application ID
DISCORD_GUILD_ID=          # opsional, isi untuk dev (slash command instan)

# Admin bot commands (CSV user IDs)
ADMIN_TELEGRAM_IDS=        # contoh: 12345,67890 (lihat @userinfobot)
ADMIN_DISCORD_IDS=         # contoh: 1112,3334 (Developer Mode > Copy User ID)

# Admin web dashboard — kosongkan ADMIN_USERNAME untuk disable
ADMIN_USERNAME=
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=      # generate: openssl rand -hex 32

# Database
DATABASE_URL="file:./dev.db"

# Webhook
PUBLIC_BASE_URL=           # contoh: https://abc123.ngrok.io
```

---

## Webhook Public URL

KlikQRIS perlu URL public untuk kirim callback. Untuk testing lokal, pakai tunnel:

**Pakai ngrok**:

```bash
# install: https://ngrok.com/download
ngrok http 3000
# copy URL https://xxxx.ngrok.io
# daftarkan https://xxxx.ngrok.io/webhook/klikqris di dashboard KlikQRIS
```

**Pakai Cloudflare Tunnel** (gratis, tanpa daftar):

```bash
cloudflared tunnel --url http://localhost:3000
```

Untuk production: deploy ke VPS / Railway / Fly.io / Render dan pakai domain HTTPS milik kamu.

---

## Admin Dashboard

Web UI untuk kelola toko dari browser. Auto-aktif saat `ADMIN_USERNAME` & `ADMIN_PASSWORD` diisi.

**Setup:**

```bash
# Edit .env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=password-yang-kuat
ADMIN_SESSION_SECRET=$(openssl rand -hex 32)
```

**Akses:** `http://localhost:3000/admin` &rarr; login &rarr; dashboard.

**Halaman yang tersedia:**

| Path                              | Fungsi                                                       |
| --------------------------------- | ------------------------------------------------------------ |
| `/admin/login`                    | Form login                                                   |
| `/admin`                          | Stat cards (revenue today/7d/all-time, stok, count by status) + 10 order terakhir |
| `/admin/products`                 | List produk + form tambah produk + toggle aktif/nonaktif    |
| `/admin/products/:id/stock`       | Detail stok per produk + bulk add (paste banyak baris sekaligus) |
| `/admin/orders`                   | List order, filter status (Pending/Paid/Expired), tombol redeliver |

**Fitur kunci:**

- **Bulk add stok**: paste daftar akun/license/voucher di textarea, satu item per baris.
- **Redeliver**: kalau pembeli komplain produk gak nyampe (DM Discord blocked, dll), klik tombol Redeliver di halaman Orders. Sistem reuse stok yang sudah dialokasikan, jadi tidak double-claim.
- **Indikator delivery error**: order yang sudah PAID tapi DM gagal akan menampilkan jumlah percobaan + error message terakhir.
- **Session**: cookie HttpOnly + signed dengan `ADMIN_SESSION_SECRET`, expired 7 hari.

> **Tip keamanan:** dashboard ini tidak di-rate-limit. Untuk production, taruh di belakang reverse proxy (Caddy/Nginx) yang bisa rate-limit `/admin/login`, atau ekspos hanya via VPN/Tailscale.

---

## Admin Commands (Bot)

Selain dashboard, admin juga bisa kelola toko langsung dari chat Telegram atau Discord.

**Setup:**

1. Dapatkan numeric user ID kamu:
   - **Telegram**: chat `@userinfobot`, dia akan kirim ID-mu.
   - **Discord**: Settings &rarr; Advanced &rarr; Developer Mode ON &rarr; klik kanan profil sendiri &rarr; Copy User ID.
2. Isi di `.env`:
   ```bash
   ADMIN_TELEGRAM_IDS=123456789,987654321
   ADMIN_DISCORD_IDS=111122223333,444455556666
   ```

### Telegram Admin Commands

| Command                                          | Deskripsi                                                |
| ------------------------------------------------ | -------------------------------------------------------- |
| `/admin`                                         | Lihat daftar admin commands                              |
| `/stats`                                         | Statistik penjualan (revenue, count by status)           |
| `/orders [pending\|paid\|expired]`               | 10 order terakhir, filter optional                       |
| `/products`                                      | Daftar semua produk + stok                               |
| `/addproduct <id>\|<nama>\|<harga>\|<deskripsi>` | Tambah produk (pisahkan dengan `\|`)                     |
| `/addstock <product_id>` *(multi-line)*          | Tambah stok bulk (payload di baris-baris berikutnya)     |
| `/toggle <product_id>`                           | Aktifkan/nonaktifkan produk                              |
| `/redeliver <order_id>`                          | Kirim ulang produk untuk order tertentu                  |

**Contoh `/addstock` multi-line:**

```
/addstock NETFLIX-1B
email1@test.com|password1
email2@test.com|password2
email3@test.com|password3
```

### Discord Admin Slash Commands

Semua command admin pakai prefix `/admin-`. Hanya bisa diakses oleh user yang ada di `ADMIN_DISCORD_IDS`.

| Slash Command                                                    | Deskripsi                                |
| ---------------------------------------------------------------- | ---------------------------------------- |
| `/admin-stats`                                                   | Statistik penjualan                      |
| `/admin-orders [status]`                                         | 10 order terakhir                        |
| `/admin-products`                                                | Daftar produk                            |
| `/admin-add-product id name price [description] [type]`          | Tambah produk                            |
| `/admin-add-stock product_id payloads`                           | Tambah stok (`payloads` pisahkan `\|\|`) |
| `/admin-toggle product_id`                                       | Aktif/nonaktif produk                    |
| `/admin-redeliver order_id`                                      | Kirim ulang produk                       |

**Contoh `/admin-add-stock`:**

```
/admin-add-stock product_id:NETFLIX-1B payloads:akun1@test.com|pw1||akun2@test.com|pw2||akun3@test.com|pw3
```

(payload-nya pakai `|` internal, dan `||` sebagai separator antar item)

---

## Struktur Project

```
botnot/
├── assets/
│   └── logo.svg
├── prisma/
│   ├── schema.prisma         # Product, Stock, Order
│   └── seed.ts               # contoh data
├── src/
│   ├── admin/
│   │   ├── auth.ts           # admin ID checks
│   │   ├── service.ts        # stats, CRUD produk/stok, redeliver
│   │   └── dashboard/
│   │       ├── routes.ts     # Fastify routes /admin/*
│   │       ├── middleware.ts # session cookie auth
│   │       ├── layout.ts     # shared HTML layout
│   │       └── pages/        # home, products, stock, orders
│   ├── bots/
│   │   ├── telegram.ts       # /start /catalog /buy
│   │   ├── telegram-admin.ts # /admin /stats /orders /addstock dll
│   │   ├── discord.ts        # slash commands user
│   │   ├── discord-admin.ts  # /admin-* slash commands
│   │   └── registry.ts       # shared bot instances
│   ├── orders/
│   │   ├── service.ts        # createOrder, markOrderPaid
│   │   └── delivery.ts       # auto-deliver stok ke pembeli (retry-safe)
│   ├── payment/
│   │   ├── klikqris.ts       # client API
│   │   └── webhook.ts        # POST /webhook/klikqris
│   ├── products/catalog.ts
│   ├── config.ts             # zod-validated env
│   ├── db.ts                 # prisma client
│   ├── logger.ts             # pino
│   └── index.ts              # entrypoint (HTTP + bots)
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Perintah Bot

### Telegram

| Command                 | Deskripsi                          |
| ----------------------- | ---------------------------------- |
| `/start`                | Welcome message + daftar perintah  |
| `/catalog`              | Lihat semua produk + harga + stok  |
| `/buy <product_id>`     | Beli 1 unit                        |
| `/buy <product_id> <n>` | Beli `n` unit                      |

### Discord

| Slash Command                            | Deskripsi               |
| ---------------------------------------- | ----------------------- |
| `/catalog`                               | Lihat semua produk      |
| `/buy product_id:<id>`                   | Beli 1 unit             |
| `/buy product_id:<id> qty:<n>`           | Beli `n` unit           |

### Tambah produk

Cara termudah: pakai **[Admin Dashboard](#admin-dashboard)** di `/admin/products`.

Atau dari bot pakai **[Admin Commands](#admin-commands-bot)** seperti `/addproduct` (Telegram) atau `/admin-add-product` (Discord).

Atau via Prisma Studio:

```bash
npm run db:studio
# buka http://localhost:5555, edit tabel Product & Stock
```

Atau edit `prisma/seed.ts` lalu jalanin `npm run db:seed`.

---

## Deploy ke Production

1. **Database**: ganti SQLite ke PostgreSQL (Neon/Supabase/Railway):
   ```prisma
   // prisma/schema.prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. **Build**:
   ```bash
   npm run build
   npm run db:migrate deploy
   npm start
   ```
3. **Process manager**: pakai `pm2`, `systemd`, atau Docker.
4. **Public HTTPS**: wajib untuk webhook KlikQRIS. Pakai reverse proxy (Caddy/Nginx) atau hosting yang bawa HTTPS otomatis.
5. **Environment**: set `NODE_ENV=production` biar log JSON (lebih ringan).

---

## Roadmap

- [x] Admin web dashboard (login, products, stock, orders, redeliver)
- [x] Admin bot commands (Telegram + Discord)
- [x] Retry-safe delivery dengan tombol redeliver di dashboard
- [ ] Cron auto-expire order yang stuck `PENDING`
- [ ] Retry queue (BullMQ + Redis) untuk delivery yang gagal
- [ ] Notifikasi WhatsApp via flag `notifwa` KlikQRIS
- [ ] Dashboard analytics (chart penjualan, top produk)
- [ ] Integrasi role Discord otomatis (untuk produk tipe `ROLE`)
- [ ] Rate limiting di `/admin/login`
- [ ] Unit & integration tests

---

## Kontribusi

PR sangat welcome! Cara kontribusi:

1. Fork repo ini
2. Buat branch: `git checkout -b feat/nama-fitur`
3. Commit: `git commit -m "feat: deskripsi"`
4. Push: `git push origin feat/nama-fitur`
5. Buka Pull Request ke branch `main`

Issue untuk laporan bug atau request fitur juga sangat membantu!

---

## License

Dilisensikan di bawah [MIT License](./LICENSE) &mdash; bebas digunakan, dimodifikasi, dan didistribusikan, termasuk untuk keperluan komersial.

---

<p align="center">
  Dibuat untuk komunitas seller digital Indonesia.<br>
  <i>Kalau berguna, kasih bintang &#x2B50; ya!</i>
</p>
