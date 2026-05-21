import { escapeHtml } from "../admin/dashboard/layout.js";

interface SetupFormData {
  current: Map<string, string>;
  flash?: { kind: "success" | "error" | "info"; message: string } | null;
  saved?: boolean;
  backupPath?: string | null;
}

export function renderSetupPage(data: SetupFormData): string {
  const v = (key: string) => escapeHtml(data.current.get(key) ?? "");

  const flashHtml = data.flash
    ? `<div class="mb-6 rounded-lg border px-4 py-3 text-sm ${
        data.flash.kind === "success"
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
          : data.flash.kind === "error"
            ? "border-red-500/40 bg-red-500/10 text-red-300"
            : "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
      }">${escapeHtml(data.flash.message)}</div>`
    : "";

  const savedBanner = data.saved
    ? `<div class="mb-6 rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-6">
        <h2 class="text-lg font-bold text-emerald-300 mb-2">Konfigurasi tersimpan</h2>
        <p class="text-sm text-slate-300 mb-3">File <code class="text-xs bg-slate-900 px-2 py-1 rounded">.env</code> berhasil ditulis.${
          data.backupPath
            ? ` Backup lama disimpan di <code class="text-xs bg-slate-900 px-2 py-1 rounded">${escapeHtml(data.backupPath.split("/").pop() ?? "")}</code>.`
            : ""
        }</p>
        <p class="text-sm text-slate-300 mb-3"><strong class="text-amber-300">Penting:</strong> restart server (Ctrl+C, lalu <code class="text-xs bg-slate-900 px-2 py-1 rounded">npm run dev</code>) supaya konfigurasi baru aktif.</p>
        <a href="/admin/login" class="inline-block bg-gradient-to-r from-cyan-500 to-violet-500 hover:opacity-90 transition rounded-lg px-5 py-2 font-medium text-sm">Lanjut ke Admin Login →</a>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Setup Wizard · botnot</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>body{font-family:'Segoe UI',system-ui,sans-serif}</style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">
  <header class="border-b border-slate-800 bg-slate-900/60 backdrop-blur">
    <div class="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
      <span class="font-bold text-lg bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">botnot</span>
      <span class="text-slate-600">/</span>
      <span class="text-slate-400 text-sm">setup wizard</span>
    </div>
  </header>

  <main class="max-w-3xl mx-auto px-4 py-8">
    ${savedBanner}
    ${flashHtml}

    ${
      !data.saved
        ? `<div class="mb-6">
            <h1 class="text-2xl font-bold mb-2">Selamat datang!</h1>
            <p class="text-slate-400 text-sm">Atur kredensial bot kamu di sini. Semua field optional kecuali Admin Dashboard. Bisa diisi sebagian dulu, ditambah belakangan.</p>
          </div>`
        : ""
    }

    <form method="POST" action="/setup" class="space-y-8">

      ${section(
        "Server",
        `
        ${field("PORT", "Port HTTP", v("PORT") || "3000", "number", "3000")}
        ${field("PUBLIC_BASE_URL", "Public Base URL (untuk webhook KlikQRIS)", v("PUBLIC_BASE_URL"), "url", "https://abc123.ngrok.io")}
        `,
      )}

      ${section(
        "KlikQRIS",
        `
        <p class="text-xs text-slate-500 mb-3">Dapatkan dari dashboard merchant <a href="https://klikqris.com" target="_blank" class="text-cyan-400 underline">klikqris.com</a>. Boleh dikosongkan dulu — bot tetap jalan, /buy gagal sampai diisi.</p>
        ${field("KLIKQRIS_API_KEY", "API Key (x-api-key)", v("KLIKQRIS_API_KEY"), "password", "Y4DSZg...")}
        ${field("KLIKQRIS_MERCHANT_ID", "Merchant ID", v("KLIKQRIS_MERCHANT_ID"), "text", "177301847754")}
        `,
      )}

      ${section(
        "Telegram Bot",
        `
        <p class="text-xs text-slate-500 mb-3">Dapatkan token dari <a href="https://t.me/BotFather" target="_blank" class="text-cyan-400 underline">@BotFather</a> dengan command /newbot.</p>
        ${field("TELEGRAM_BOT_TOKEN", "Bot Token", v("TELEGRAM_BOT_TOKEN"), "password", "123456:ABC-DEF...")}
        `,
      )}

      ${section(
        "Discord Bot",
        `
        <p class="text-xs text-slate-500 mb-3">Buat di <a href="https://discord.com/developers/applications" target="_blank" class="text-cyan-400 underline">Discord Developer Portal</a>.</p>
        ${field("DISCORD_BOT_TOKEN", "Bot Token", v("DISCORD_BOT_TOKEN"), "password", "MTI...AAA")}
        ${field("DISCORD_CLIENT_ID", "Application ID (Client ID)", v("DISCORD_CLIENT_ID"), "text", "1234567890")}
        ${field("DISCORD_GUILD_ID", "Guild ID (opsional, dev only)", v("DISCORD_GUILD_ID"), "text", "9876543210")}
        `,
      )}

      ${section(
        "Owner",
        `
        <p class="text-xs text-slate-500 mb-3">Owner = primary admin. Dapat notifikasi otomatis (bot online, delivery gagal). Otomatis termasuk admin, gak perlu didouble di field admin di bawah.<br>
        Telegram: chat <a href="https://t.me/userinfobot" target="_blank" class="text-cyan-400 underline">@userinfobot</a> untuk dapet ID.<br>
        Discord: Settings → Advanced → Developer Mode ON, klik kanan profil → Copy User ID.</p>
        ${field("OWNER_TELEGRAM_ID", "Owner Telegram User ID", v("OWNER_TELEGRAM_ID"), "text", "123456789")}
        ${field("OWNER_DISCORD_ID", "Owner Discord User ID", v("OWNER_DISCORD_ID"), "text", "111122223333")}
        `,
      )}

      ${section(
        "Admin tambahan",
        `
        <p class="text-xs text-slate-500 mb-3">User ID lain yg boleh pakai admin commands di bot. Pisahkan dengan koma.</p>
        ${field("ADMIN_TELEGRAM_IDS", "Telegram Admin IDs (CSV)", v("ADMIN_TELEGRAM_IDS"), "text", "123,456")}
        ${field("ADMIN_DISCORD_IDS", "Discord Admin IDs (CSV)", v("ADMIN_DISCORD_IDS"), "text", "111,222")}
        `,
      )}

      ${section(
        "Web Dashboard",
        `
        <p class="text-xs text-slate-500 mb-3"><strong class="text-amber-300">Wajib</strong> untuk akses /admin. Pakai password yang kuat.</p>
        ${field("ADMIN_USERNAME", "Username", v("ADMIN_USERNAME"), "text", "admin", true)}
        ${field("ADMIN_PASSWORD", "Password", v("ADMIN_PASSWORD"), "password", "min 12 karakter", true)}
        <div class="mb-4">
          <label class="block text-xs uppercase tracking-wide text-slate-500 mb-1">Session Secret</label>
          <div class="flex gap-2">
            <input id="secret_input" name="ADMIN_SESSION_SECRET" value="${v("ADMIN_SESSION_SECRET")}" placeholder="dikosongkan = auto-generate"
              class="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-xs focus:border-cyan-500 focus:outline-none" />
            <button type="button" onclick="genSecret()"
              class="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-3 py-2 text-sm">Generate</button>
          </div>
          <p class="text-xs text-slate-600 mt-1">String random untuk sign cookies. Kosongkan untuk auto-generate.</p>
        </div>
        `,
      )}

      ${section(
        "Database",
        `
        ${field("DATABASE_URL", "DATABASE_URL", v("DATABASE_URL") || "file:./dev.db", "text", "file:./dev.db")}
        <p class="text-xs text-slate-500">Default SQLite di <code class="bg-slate-900 px-1 rounded">prisma/dev.db</code>. Untuk Postgres: <code class="bg-slate-900 px-1 rounded">postgresql://...</code></p>
        `,
      )}

      <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
        <a href="/admin" class="px-5 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-100">Skip</a>
        <button class="bg-gradient-to-r from-cyan-500 to-violet-500 hover:opacity-90 transition rounded-lg px-6 py-2 font-medium">Simpan ke .env</button>
      </div>
    </form>
  </main>

  <script>
    function genSecret() {
      const arr = new Uint8Array(32);
      crypto.getRandomValues(arr);
      document.getElementById('secret_input').value = Array.from(arr)
        .map(b => b.toString(16).padStart(2, '0')).join('');
    }
  </script>
</body>
</html>`;
}

function section(title: string, content: string): string {
  return `<fieldset class="bg-slate-900 border border-slate-800 rounded-xl p-6">
    <legend class="px-2 text-sm font-semibold text-cyan-300">${escapeHtml(title)}</legend>
    ${content}
  </fieldset>`;
}

function field(
  name: string,
  label: string,
  value: string,
  type: string = "text",
  placeholder = "",
  required = false,
): string {
  return `<div class="mb-4">
    <label class="block text-xs uppercase tracking-wide text-slate-500 mb-1">${escapeHtml(label)}${required ? ' <span class="text-red-400">*</span>' : ""}</label>
    <input name="${escapeHtml(name)}" value="${value}" type="${escapeHtml(type)}" placeholder="${escapeHtml(placeholder)}" ${required ? "required" : ""}
      class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 ${type === "password" ? "font-mono text-sm" : ""} focus:border-cyan-500 focus:outline-none" />
  </div>`;
}
