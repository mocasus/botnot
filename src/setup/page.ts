import { escapeHtml } from "../admin/dashboard/layout.js";

interface SetupFormData {
  current: Map<string, string>;
  flash?: { kind: "success" | "error" | "info"; message: string } | null;
  saved?: boolean;
  backupPath?: string | null;
}

const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect x='3' y='11' width='18' height='10' rx='2' fill='%2322d3ee'/%3E%3Ccircle cx='12' cy='5' r='2' fill='%23a78bfa'/%3E%3C/svg%3E";

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
    ? `<div class="mb-6 rounded-2xl p-6 bg-emerald-500/[0.08] border border-emerald-500/30 ring-1 ring-emerald-500/20">
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/15 grid place-items-center text-emerald-400 shrink-0">
            ${checkIcon}
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="text-lg font-bold text-white mb-1.5">Konfigurasi tersimpan</h2>
            <p class="text-sm text-slate-300 mb-2 leading-relaxed">
              File <code class="text-xs bg-slate-950/60 px-1.5 py-0.5 rounded border border-white/[0.06]">.env</code> berhasil ditulis.${
                data.backupPath
                  ? ` Backup lama disimpan sebagai <code class="text-xs bg-slate-950/60 px-1.5 py-0.5 rounded border border-white/[0.06]">${escapeHtml(data.backupPath.split("/").pop() ?? "")}</code>.`
                  : ""
              }
            </p>
            <p class="text-sm text-amber-200/90 mb-4 leading-relaxed">
              <strong class="text-amber-300">Penting:</strong> restart server (Ctrl+C lalu <code class="text-xs bg-slate-950/60 px-1.5 py-0.5 rounded border border-white/[0.06]">npm run dev</code>) supaya konfigurasi baru aktif.
            </p>
            <a href="/admin/login" class="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 active:scale-[0.98] transition rounded-xl px-5 py-2.5 font-semibold shadow-lg shadow-cyan-500/20 text-white text-sm">
              Lanjut ke Admin Login ${arrowRightIcon}
            </a>
          </div>
        </div>
      </div>`
    : "";

  const sections = `
    ${section({
      title: "Server",
      subtitle: "Port dan public URL untuk webhook",
      icon: serverIcon,
      iconColor: "text-cyan-400",
      iconBg: "bg-cyan-500/10",
      content: `
        ${field({ name: "PORT", label: "Port HTTP", value: v("PORT") || "3000", type: "number", placeholder: "3000" })}
        ${field({ name: "PUBLIC_BASE_URL", label: "Public Base URL", value: v("PUBLIC_BASE_URL"), type: "url", placeholder: "https://abc123.ngrok.io", help: "Untuk webhook KlikQRIS. Pakai ngrok untuk dev." })}
      `,
    })}

    ${section({
      title: "KlikQRIS",
      subtitle: "Payment gateway QRIS",
      icon: qrIcon,
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/10",
      content: `
        <p class="text-sm text-slate-400 mb-4 leading-relaxed">Dapatkan dari dashboard merchant <a href="https://klikqris.com" target="_blank" class="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">klikqris.com</a>. Boleh dikosongkan dulu &mdash; bot tetap jalan, tapi <code class="text-xs bg-slate-950/60 px-1.5 py-0.5 rounded">/buy</code> gagal sampai diisi.</p>
        ${field({ name: "KLIKQRIS_API_KEY", label: "API Key (x-api-key)", value: v("KLIKQRIS_API_KEY"), type: "password", placeholder: "Y4DSZg..." })}
        ${field({ name: "KLIKQRIS_MERCHANT_ID", label: "Merchant ID", value: v("KLIKQRIS_MERCHANT_ID"), type: "text", placeholder: "177301847754" })}
      `,
    })}

    ${section({
      title: "Telegram Bot",
      subtitle: "Opsional",
      icon: telegramIcon,
      iconColor: "text-cyan-400",
      iconBg: "bg-cyan-500/10",
      content: `
        <p class="text-sm text-slate-400 mb-4 leading-relaxed">Dapatkan token dari <a href="https://t.me/BotFather" target="_blank" class="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">@BotFather</a> dengan command <code class="text-xs bg-slate-950/60 px-1.5 py-0.5 rounded">/newbot</code>.</p>
        ${field({ name: "TELEGRAM_BOT_TOKEN", label: "Bot Token", value: v("TELEGRAM_BOT_TOKEN"), type: "password", placeholder: "123456:ABC-DEF..." })}
      `,
    })}

    ${section({
      title: "Discord Bot",
      subtitle: "Opsional",
      icon: discordIcon,
      iconColor: "text-violet-400",
      iconBg: "bg-violet-500/10",
      content: `
        <p class="text-sm text-slate-400 mb-4 leading-relaxed">Buat di <a href="https://discord.com/developers/applications" target="_blank" class="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">Discord Developer Portal</a>.</p>
        ${field({ name: "DISCORD_BOT_TOKEN", label: "Bot Token", value: v("DISCORD_BOT_TOKEN"), type: "password", placeholder: "MTI...AAA" })}
        ${field({ name: "DISCORD_CLIENT_ID", label: "Application ID (Client ID)", value: v("DISCORD_CLIENT_ID"), type: "text", placeholder: "1234567890" })}
        ${field({ name: "DISCORD_GUILD_ID", label: "Guild ID", value: v("DISCORD_GUILD_ID"), type: "text", placeholder: "9876543210", help: "Opsional, untuk dev (slash command instan)." })}
      `,
    })}

    ${section({
      title: "Owner",
      subtitle: "Primary admin yang dapat notifikasi",
      icon: crownIcon,
      iconColor: "text-amber-400",
      iconBg: "bg-amber-500/10",
      content: `
        <p class="text-sm text-slate-400 mb-4 leading-relaxed">Owner = primary admin. Dapat notifikasi otomatis (bot online, delivery gagal) dan otomatis termasuk admin.</p>
        <ul class="text-xs text-slate-500 mb-4 space-y-1 leading-relaxed pl-4 list-disc">
          <li>Telegram: chat <a href="https://t.me/userinfobot" target="_blank" class="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">@userinfobot</a> untuk dapet ID</li>
          <li>Discord: Settings &rarr; Advanced &rarr; Developer Mode ON, klik kanan profil &rarr; Copy User ID</li>
        </ul>
        ${field({ name: "OWNER_TELEGRAM_ID", label: "Owner Telegram User ID", value: v("OWNER_TELEGRAM_ID"), type: "text", placeholder: "123456789" })}
        ${field({ name: "OWNER_DISCORD_ID", label: "Owner Discord User ID", value: v("OWNER_DISCORD_ID"), type: "text", placeholder: "111122223333" })}
      `,
    })}

    ${section({
      title: "Admin tambahan",
      subtitle: "Selain owner",
      icon: userIcon,
      iconColor: "text-violet-400",
      iconBg: "bg-violet-500/10",
      content: `
        <p class="text-sm text-slate-400 mb-4 leading-relaxed">User ID lain yg boleh pakai admin commands di bot. Pisahkan dengan koma.</p>
        ${field({ name: "ADMIN_TELEGRAM_IDS", label: "Telegram Admin IDs", value: v("ADMIN_TELEGRAM_IDS"), type: "text", placeholder: "123,456" })}
        ${field({ name: "ADMIN_DISCORD_IDS", label: "Discord Admin IDs", value: v("ADMIN_DISCORD_IDS"), type: "text", placeholder: "111,222" })}
      `,
    })}

    ${section({
      title: "Web Dashboard",
      subtitle: "Wajib untuk akses /admin",
      icon: lockIcon,
      iconColor: "text-cyan-400",
      iconBg: "bg-cyan-500/10",
      required: true,
      content: `
        <div class="mb-4 rounded-xl bg-amber-500/[0.08] border border-amber-500/20 px-4 py-3 text-xs text-amber-200/90 leading-relaxed">
          <strong class="text-amber-300">Wajib diisi.</strong> Kalau dikosongkan, dashboard di <code class="bg-slate-950/60 px-1.5 py-0.5 rounded text-[10px]">/admin</code> tidak aktif. Pakai password kuat (min. 8 karakter).
        </div>
        ${field({ name: "ADMIN_USERNAME", label: "Username", value: v("ADMIN_USERNAME"), type: "text", placeholder: "admin", required: true })}
        ${field({ name: "ADMIN_PASSWORD", label: "Password", value: v("ADMIN_PASSWORD"), type: "password", placeholder: "min 12 karakter", required: true })}
        <div>
          <label class="block text-xs uppercase tracking-wider text-slate-500 mb-1.5 font-medium">Session Secret</label>
          <div class="flex gap-2">
            <input id="secret_input" name="ADMIN_SESSION_SECRET" value="${v("ADMIN_SESSION_SECRET")}" placeholder="dikosongkan = auto-generate"
              class="flex-1 bg-slate-950/60 border border-slate-700/50 rounded-xl px-4 py-2.5 font-mono text-xs text-slate-200 focus:border-cyan-500/50 focus:outline-none transition placeholder:text-slate-600" />
            <button type="button" onclick="genSecret()"
              class="bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 hover:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-200 transition whitespace-nowrap font-medium">Generate</button>
          </div>
          <p class="text-[11px] text-slate-500 mt-1.5 leading-relaxed">String random untuk sign cookies. Kosongkan untuk auto-generate.</p>
        </div>
      `,
    })}

    ${section({
      title: "Database",
      subtitle: "SQLite (dev) atau PostgreSQL (prod)",
      icon: databaseIcon,
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/10",
      content: `
        ${field({ name: "DATABASE_URL", label: "DATABASE_URL", value: v("DATABASE_URL") || "file:./dev.db", type: "text", placeholder: "file:./dev.db", help: "Default SQLite di prisma/dev.db. Untuk Postgres: postgresql://..." })}
      `,
    })}
  `;

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Setup Wizard &middot; botnot</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="icon" href="${FAVICON}" />
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
          },
        },
      },
    };
  </script>
  <style>
    html { font-feature-settings: 'cv11', 'ss01', 'ss03'; }
    body { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
    code, pre, .font-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
    .bg-grid {
      background-image:
        linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px);
      background-size: 32px 32px;
    }
    ::-webkit-scrollbar { width: 10px; height: 10px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 5px; border: 2px solid transparent; background-clip: content-box; }
    ::-webkit-scrollbar-thumb:hover { background: #334155; background-clip: content-box; }
    ::selection { background: rgba(34,211,238,0.2); color: #ecfeff; }
    input::placeholder, textarea::placeholder { color: #475569; }
    .card { background: linear-gradient(180deg, rgba(30,41,59,0.4) 0%, rgba(15,23,42,0.4) 100%); border: 1px solid rgba(51,65,85,0.5); }
    .card:hover { border-color: rgba(71,85,105,0.7); }
  </style>
</head>
<body class="bg-[#0a0e1a] text-slate-100 min-h-screen bg-grid">
  <!-- Ambient glow -->
  <div class="fixed inset-0 pointer-events-none overflow-hidden">
    <div class="absolute -top-40 left-1/4 w-[600px] h-[400px] bg-cyan-500/[0.06] rounded-full blur-[120px]"></div>
    <div class="absolute top-1/2 right-0 w-[500px] h-[400px] bg-violet-500/[0.06] rounded-full blur-[120px]"></div>
  </div>

  <!-- Header -->
  <header class="border-b border-white/[0.06] bg-[#0a0e1a]/80 backdrop-blur-xl sticky top-0 z-30">
    <div class="max-w-3xl mx-auto px-4 md:px-6 h-16 flex items-center gap-3">
      <a href="/admin" class="flex items-center gap-2.5 group">
        <span class="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-cyan-500 to-violet-500 grid place-items-center text-slate-950 shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform">
          ${botIcon}
        </span>
        <span class="font-bold text-lg tracking-tight">
          <span class="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">bot</span><span class="bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">not</span>
        </span>
      </a>
      <span class="text-slate-700 hidden sm:inline">/</span>
      <span class="text-slate-400 text-sm hidden sm:inline">setup wizard</span>
    </div>
  </header>

  <main class="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12 relative z-10">
    ${savedBanner}
    ${flashHtml}

    ${
      !data.saved
        ? `<div class="mb-10">
            <div class="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-medium">
              ${sparkleIcon} First-run setup
            </div>
            <h1 class="text-3xl md:text-4xl font-bold tracking-tight text-white mb-3">Selamat datang di botnot</h1>
            <p class="text-slate-400 leading-relaxed max-w-xl">Atur kredensial bot kamu di sini. Semua field opsional kecuali Web Dashboard. Bisa diisi sebagian dulu, ditambah belakangan.</p>
          </div>`
        : ""
    }

    <form method="POST" action="/setup" class="space-y-5">
      ${sections}

      <!-- Submit Bar -->
      <div class="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3 pt-4">
        <a href="/admin" class="text-sm text-slate-400 hover:text-white transition-colors px-4 py-2.5 text-center sm:text-left">
          Skip untuk sekarang
        </a>
        <button class="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 active:scale-[0.98] transition rounded-xl px-6 py-3 font-semibold shadow-lg shadow-cyan-500/25 text-white">
          ${saveIcon} Simpan ke .env
        </button>
      </div>
    </form>

    <!-- Footer hint -->
    <div class="mt-12 pt-6 border-t border-white/[0.04] text-center">
      <p class="text-xs text-slate-500 leading-relaxed">
        Setelah simpan, restart server (<code class="text-slate-400 bg-slate-950/60 px-1.5 py-0.5 rounded text-[11px]">Ctrl+C</code> &rarr; <code class="text-slate-400 bg-slate-950/60 px-1.5 py-0.5 rounded text-[11px]">npm run dev</code>) untuk apply config.
      </p>
    </div>
  </main>

  <script>
    function genSecret() {
      const arr = new Uint8Array(32);
      crypto.getRandomValues(arr);
      document.getElementById('secret_input').value = Array.from(arr)
        .map(function(b){ return b.toString(16).padStart(2, '0'); }).join('');
    }
  </script>
</body>
</html>`;
}


// === Helpers ===

interface SectionOpts {
  title: string;
  subtitle?: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  content: string;
  required?: boolean;
}

function section(opts: SectionOpts): string {
  return `<section class="card rounded-2xl overflow-hidden transition-colors">
    <header class="px-5 md:px-6 py-4 border-b border-white/[0.04] flex items-center gap-3">
      <span class="w-9 h-9 rounded-xl ${opts.iconBg} grid place-items-center ${opts.iconColor} shrink-0">${opts.icon}</span>
      <div class="flex-1 min-w-0">
        <h2 class="font-semibold text-white text-base flex items-center gap-2">
          ${escapeHtml(opts.title)}
          ${opts.required ? '<span class="text-[10px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">Required</span>' : ""}
        </h2>
        ${opts.subtitle ? `<p class="text-xs text-slate-500 mt-0.5">${escapeHtml(opts.subtitle)}</p>` : ""}
      </div>
    </header>
    <div class="p-5 md:p-6">
      ${opts.content}
    </div>
  </section>`;
}

interface FieldOpts {
  name: string;
  label: string;
  value: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  help?: string;
}

function field(opts: FieldOpts): string {
  const type = opts.type ?? "text";
  const isMonoFont =
    type === "password" ||
    opts.name.includes("ID") ||
    opts.name === "DATABASE_URL" ||
    opts.name === "PUBLIC_BASE_URL";
  const inputCls = isMonoFont ? "font-mono text-sm" : "text-sm";
  return `<div class="mb-4 last:mb-0">
    <label class="block text-xs uppercase tracking-wider text-slate-500 mb-1.5 font-medium">
      ${escapeHtml(opts.label)}${opts.required ? ' <span class="text-amber-400 normal-case font-semibold">*</span>' : ""}
    </label>
    <input
      name="${escapeHtml(opts.name)}"
      value="${opts.value}"
      type="${escapeHtml(type)}"
      placeholder="${escapeHtml(opts.placeholder ?? "")}"
      ${opts.required ? "required" : ""}
      class="w-full bg-slate-950/60 border border-slate-700/50 rounded-xl px-4 py-2.5 ${inputCls} text-slate-100 hover:border-slate-600 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/15 focus:outline-none transition placeholder:text-slate-600" />
    ${opts.help ? `<p class="text-[11px] text-slate-500 mt-1.5 leading-relaxed">${escapeHtml(opts.help)}</p>` : ""}
  </div>`;
}

// === Inline SVG icons ===

function svg(path: string, size = "w-4 h-4"): string {
  return `<svg class="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

const botIcon = svg(
  `<rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/>`,
  "w-5 h-5",
);
const serverIcon = svg(`<rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>`, "w-[18px] h-[18px]");
const qrIcon = svg(`<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><line x1="14" y1="14" x2="14.01" y2="14"/><line x1="20" y1="14" x2="20.01" y2="14"/><line x1="17" y1="17" x2="17.01" y2="17"/><line x1="14" y1="20" x2="14.01" y2="20"/><line x1="20" y1="20" x2="20.01" y2="20"/>`, "w-[18px] h-[18px]");
const telegramIcon = svg(`<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>`, "w-[18px] h-[18px]");
const discordIcon = svg(`<path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/><line x1="9" y1="10" x2="9.01" y2="10"/><line x1="15" y1="10" x2="15.01" y2="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/>`, "w-[18px] h-[18px]");
const crownIcon = svg(`<path d="M2 7l5 5 5-7 5 7 5-5v13H2z"/>`, "w-[18px] h-[18px]");
const userIcon = svg(`<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`, "w-[18px] h-[18px]");
const lockIcon = svg(`<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>`, "w-[18px] h-[18px]");
const databaseIcon = svg(`<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>`, "w-[18px] h-[18px]");
const checkIcon = svg(`<polyline points="20 6 9 17 4 12"/>`, "w-5 h-5");
const arrowRightIcon = svg(`<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>`, "w-3.5 h-3.5");
const saveIcon = svg(`<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>`);
const sparkleIcon = svg(`<path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/>`, "w-3.5 h-3.5");

function flashIcon(kind: "success" | "error" | "info"): string {
  if (kind === "success") return checkIcon;
  if (kind === "error")
    return svg(
      `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`,
    );
  return svg(`<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`);
}
