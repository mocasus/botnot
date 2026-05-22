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
    ? `<div class="mb-6 rounded-xl border px-4 py-3.5 text-sm flex items-start gap-3 ${
        data.flash.kind === "success"
          ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-200"
          : data.flash.kind === "error"
            ? "border-red-500/30 bg-red-500/5 text-red-200"
            : "border-cyan-500/30 bg-cyan-500/5 text-cyan-200"
      }">
        <span class="shrink-0 mt-0.5">${flashIcon(data.flash.kind)}</span>
        <span class="flex-1">${escapeHtml(data.flash.message)}</span>
      </div>`
    : "";

  const savedBanner = data.saved
    ? `<div class="mb-6 card-glass rounded-2xl p-6 border-emerald-500/30 ring-1 ring-emerald-500/20 animate-in">
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/10 grid place-items-center text-emerald-400 shrink-0">
            ${checkIcon}
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="text-lg font-bold text-white mb-1.5">Konfigurasi tersimpan</h2>
            <p class="text-sm text-slate-400 mb-2 leading-relaxed">
              File <code class="text-xs bg-slate-950/60 px-1.5 py-0.5 rounded border border-white/[0.06]">.env</code> berhasil ditulis.${
                data.backupPath
                  ? ` Backup lama disimpan sebagai <code class="text-xs bg-slate-950/60 px-1.5 py-0.5 rounded border border-white/[0.06]">${escapeHtml(data.backupPath.split("/").pop() ?? "")}</code>.`
                  : ""
              }
            </p>
            <p class="text-sm text-slate-400 mb-4 leading-relaxed">
              <strong class="text-amber-300">Penting:</strong> restart server (Ctrl+C, lalu <code class="text-xs bg-slate-950/60 px-1.5 py-0.5 rounded border border-white/[0.06]">npm run dev</code>) supaya konfigurasi baru aktif.
            </p>
            <a href="/admin/login" class="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 active:scale-[0.98] transition-all rounded-xl px-5 py-2.5 font-semibold shadow-lg shadow-cyan-500/20 text-white text-sm">
              Lanjut ke Admin Login ${arrowRightIcon}
            </a>
          </div>
        </div>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Setup Wizard · botnot</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com/3.4.17"></script>
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect x='3' y='11' width='18' height='10' rx='2' fill='%2322d3ee'/%3E%3Ccircle cx='12' cy='5' r='2' fill='%23a78bfa'/%3E%3C/svg%3E" />
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
          },
          animation: {
            'slide-up': 'slideUp 0.3s ease-out',
          },
          keyframes: {
            slideUp: { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
          },
        },
      },
    };
  </script>
  <style>
    body { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
    code, pre, .font-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
    .bg-grid { background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.015) 1px, transparent 0); background-size: 32px 32px; }
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #334155; }
    ::selection { background: rgba(34,211,238,0.2); color: #ecfeff; }
    .glass { background: rgba(15,23,42,0.7); backdrop-filter: blur(12px) saturate(180%); -webkit-backdrop-filter: blur(12px) saturate(180%); }
    .card-glass { background: rgba(15,23,42,0.5); backdrop-filter: blur(8px); border: 1px solid rgba(51,65,85,0.5); }
    input:focus, textarea:focus, select:focus { box-shadow: 0 0 0 3px rgba(34,211,238,0.1); }
    .animate-in { animation: slideUp 0.3s ease-out both; }
  </style>
</head>
<body class="bg-[#0a0e1a] text-slate-100 min-h-screen bg-grid">
  <!-- Ambient glow -->
  <div class="fixed inset-0 pointer-events-none">
    <div class="absolute top-0 left-1/4 w-[600px] h-[400px] bg-cyan-500/[0.05] rounded-full blur-[120px]"></div>
    <div class="absolute top-1/3 right-1/4 w-[500px] h-[350px] bg-violet-500/[0.05] rounded-full blur-[120px]"></div>
  </div>

  <!-- Header -->
  <header class="glass border-b border-white/[0.06] sticky top-0 z-30">
    <div class="max-w-3xl mx-auto px-4 md:px-6 h-16 flex items-center gap-3">
      <span class="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-cyan-500 to-violet-500 grid place-items-center text-slate-950 shadow-lg shadow-cyan-500/20">
        ${botIcon}
      </span>
      <div class="flex items-center gap-2.5">
        <span class="font-bold text-lg tracking-tight">
          <span class="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">bot</span><span class="bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">not</span>
        </span>
        <span class="text-slate-700">/</span>
        <span class="text-slate-400 text-sm">setup wizard</span>
      </div>
    </div>
  </header>

  <main class="max-w-3xl mx-auto px-4 md:px-6 py-8 relative z-10">
    ${savedBanner}
    ${flashHtml}

    ${
      !data.saved
        ? `<div class="mb-8 animate-in">
            <h1 class="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">Selamat datang!</h1>
            <p class="text-slate-400 text-sm leading-relaxed max-w-xl">Atur kredensial bot kamu di sini. Semua field opsional kecuali Admin Dashboard. Bisa diisi sebagian dulu, ditambah belakangan.</p>
          </div>`
        : ""
    }

    <form method="POST" action="/setup" class="space-y-5">
      ${section("Server", serverIcon, "0.05s", `
        ${field("PORT", "Port HTTP", v("PORT") || "3000", "number", "3000")}
        ${field("PUBLIC_BASE_URL", "Public Base URL (untuk webhook KlikQRIS)", v("PUBLIC_BASE_URL"), "url", "https://abc123.ngrok.io")}
      `)}

      ${section("KlikQRIS", qrIcon, "0.1s", `
        <p class="text-xs text-slate-500 mb-4 leading-relaxed">Dapatkan dari dashboard merchant <a href="https://klikqris.com" target="_blank" class="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">klikqris.com</a>. Boleh dikosongkan dulu — bot tetap jalan, /buy gagal sampai diisi.</p>
        ${field("KLIKQRIS_API_KEY", "API Key (x-api-key)", v("KLIKQRIS_API_KEY"), "password", "Y4DSZg...")}
        ${field("KLIKQRIS_MERCHANT_ID", "Merchant ID", v("KLIKQRIS_MERCHANT_ID"), "text", "177301847754")}
      `)}

      ${section("Telegram Bot", telegramIcon, "0.15s", `
        <p class="text-xs text-slate-500 mb-4 leading-relaxed">Dapatkan token dari <a href="https://t.me/BotFather" target="_blank" class="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">@BotFather</a> dengan command /newbot.</p>
        ${field("TELEGRAM_BOT_TOKEN", "Bot Token", v("TELEGRAM_BOT_TOKEN"), "password", "123456:ABC-DEF...")}
      `)}

      ${section("Discord Bot", discordIcon, "0.2s", `
        <p class="text-xs text-slate-500 mb-4 leading-relaxed">Buat di <a href="https://discord.com/developers/applications" target="_blank" class="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">Discord Developer Portal</a>.</p>
        ${field("DISCORD_BOT_TOKEN", "Bot Token", v("DISCORD_BOT_TOKEN"), "password", "MTI...AAA")}
        ${field("DISCORD_CLIENT_ID", "Application ID (Client ID)", v("DISCORD_CLIENT_ID"), "text", "1234567890")}
        ${field("DISCORD_GUILD_ID", "Guild ID (opsional, dev only)", v("DISCORD_GUILD_ID"), "text", "9876543210")}
      `)}

      ${section("Owner", crownIcon, "0.25s", `
        <p class="text-xs text-slate-500 mb-4 leading-relaxed">Owner = primary admin. Dapat notifikasi otomatis (bot online, delivery gagal). Otomatis termasuk admin, gak perlu didouble di field admin di bawah.<br>
        Telegram: chat <a href="https://t.me/userinfobot" target="_blank" class="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">@userinfobot</a> untuk dapet ID.<br>
        Discord: Settings → Advanced → Developer Mode ON, klik kanan profil → Copy User ID.</p>
        ${field("OWNER_TELEGRAM_ID", "Owner Telegram User ID", v("OWNER_TELEGRAM_ID"), "text", "123456789")}
        ${field("OWNER_DISCORD_ID", "Owner Discord User ID", v("OWNER_DISCORD_ID"), "text", "111122223333")}
      `)}

      ${section("Admin tambahan", userIcon, "0.3s", `
        <p class="text-xs text-slate-500 mb-4 leading-relaxed">User ID lain yg boleh pakai admin commands di bot. Pisahkan dengan koma.</p>
        ${field("ADMIN_TELEGRAM_IDS", "Telegram Admin IDs (CSV)", v("ADMIN_TELEGRAM_IDS"), "text", "123,456")}
        ${field("ADMIN_DISCORD_IDS", "Discord Admin IDs (CSV)", v("ADMIN_DISCORD_IDS"), "text", "111,222")}
      `)}

      ${section("Web Dashboard", lockIcon, "0.35s", `
        <div class="mb-4 rounded-lg bg-amber-500/5 border border-amber-500/20 px-3.5 py-2.5 text-xs text-amber-200/80 leading-relaxed">
          <strong class="text-amber-300">Wajib</strong> untuk akses /admin. Pakai password yang kuat (min. 8 karakter).
        </div>
        ${field("ADMIN_USERNAME", "Username", v("ADMIN_USERNAME"), "text", "admin", true)}
        ${field("ADMIN_PASSWORD", "Password", v("ADMIN_PASSWORD"), "password", "min 12 karakter", true)}
        <div class="mb-2">
          <label class="block text-xs uppercase tracking-wider text-slate-500 mb-1.5 font-medium">Session Secret</label>
          <div class="flex gap-2">
            <input id="secret_input" name="ADMIN_SESSION_SECRET" value="${v("ADMIN_SESSION_SECRET")}" placeholder="dikosongkan = auto-generate"
              class="flex-1 bg-slate-950/60 border border-slate-700/50 rounded-xl px-4 py-2.5 font-mono text-xs focus:border-cyan-500/50 focus:outline-none transition-all placeholder:text-slate-600" />
            <button type="button" onclick="genSecret()"
              class="bg-slate-800/40 hover:bg-slate-700/50 border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm transition-colors whitespace-nowrap">Generate</button>
          </div>
          <p class="text-[11px] text-slate-600 mt-1.5 leading-relaxed">String random untuk sign cookies. Kosongkan untuk auto-generate.</p>
        </div>
      `)}

      ${section("Database", databaseIcon, "0.4s", `
        ${field("DATABASE_URL", "DATABASE_URL", v("DATABASE_URL") || "file:./dev.db", "text", "file:./dev.db")}
        <p class="text-[11px] text-slate-600 leading-relaxed">Default SQLite di <code class="bg-slate-950/60 px-1.5 py-0.5 rounded border border-white/[0.06]">prisma/dev.db</code>. Untuk Postgres: <code class="bg-slate-950/60 px-1.5 py-0.5 rounded border border-white/[0.06]">postgresql://...</code></p>
      `)}

      <!-- Submit Bar -->
      <div class="sticky bottom-0 -mx-4 md:-mx-6 px-4 md:px-6 py-4 glass border-t border-white/[0.06] flex justify-between items-center gap-3 mt-8">
        <a href="/admin" class="text-sm text-slate-400 hover:text-white transition-colors px-3 py-2">Skip</a>
        <button class="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 active:scale-[0.98] transition-all rounded-xl px-6 py-2.5 font-semibold shadow-lg shadow-cyan-500/20 text-white">
          ${saveIcon} Simpan ke .env
        </button>
      </div>
    </form>

    <p class="text-center text-xs text-slate-600 mt-8 leading-relaxed">
      Setelah simpan, restart server (Ctrl+C → <code class="bg-slate-950/60 px-1.5 py-0.5 rounded border border-white/[0.06]">npm run dev</code>) untuk apply config.
    </p>
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

function section(title: string, iconSvg: string, delay: string, content: string): string {
  return `<fieldset class="card-glass rounded-2xl p-5 md:p-6 animate-in" style="animation-delay: ${delay}">
    <legend class="px-2 -ml-2 inline-flex items-center gap-2 text-sm font-semibold text-white">
      <span class="w-7 h-7 rounded-lg bg-cyan-500/10 grid place-items-center text-cyan-400">${iconSvg}</span>
      ${escapeHtml(title)}
    </legend>
    <div class="mt-2">${content}</div>
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
  const inputCls = type === "password" || name.includes("ID") || name === "DATABASE_URL"
    ? "font-mono text-sm"
    : "";
  return `<div class="mb-4 last:mb-0">
    <label class="block text-xs uppercase tracking-wider text-slate-500 mb-1.5 font-medium">
      ${escapeHtml(label)}${required ? ' <span class="text-red-400 normal-case">*</span>' : ""}
    </label>
    <input name="${escapeHtml(name)}" value="${value}" type="${escapeHtml(type)}" placeholder="${escapeHtml(placeholder)}" ${required ? "required" : ""}
      class="w-full bg-slate-950/60 border border-slate-700/50 rounded-xl px-4 py-2.5 ${inputCls} focus:border-cyan-500/50 focus:outline-none transition-all placeholder:text-slate-600" />
  </div>`;
}

// === Inline SVG icons ===
const svgWrap = (path: string, size = "w-4 h-4") =>
  `<svg class="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;

const botIcon = svgWrap(
  `<rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/>`,
  "w-5 h-5",
);
const serverIcon = svgWrap(`<rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>`);
const qrIcon = svgWrap(`<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><line x1="14" y1="14" x2="14.01" y2="14"/><line x1="20" y1="14" x2="20.01" y2="14"/><line x1="17" y1="17" x2="17.01" y2="17"/><line x1="14" y1="20" x2="14.01" y2="20"/><line x1="20" y1="20" x2="20.01" y2="20"/>`);
const telegramIcon = svgWrap(`<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>`);
const discordIcon = svgWrap(`<path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/><line x1="9" y1="10" x2="9.01" y2="10"/><line x1="15" y1="10" x2="15.01" y2="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/>`);
const crownIcon = svgWrap(`<path d="M2 7l5 5 5-7 5 7 5-5v13H2z"/>`);
const userIcon = svgWrap(`<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`);
const lockIcon = svgWrap(`<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>`);
const databaseIcon = svgWrap(`<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>`);
const checkIcon = svgWrap(`<polyline points="20 6 9 17 4 12"/>`, "w-5 h-5");
const arrowRightIcon = svgWrap(`<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>`, "w-3.5 h-3.5");
const saveIcon = svgWrap(`<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>`);

function flashIcon(kind: "success" | "error" | "info"): string {
  if (kind === "success") return checkIcon;
  if (kind === "error")
    return svgWrap(
      `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`,
    );
  return svgWrap(`<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`);
}
