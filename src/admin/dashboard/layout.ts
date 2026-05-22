interface LayoutOptions {
  title: string;
  body: string;
  active?: "home" | "products" | "stock" | "orders" | "analytics";
  flash?: { kind: "success" | "error" | "info"; message: string } | null;
  pageTitle?: string;
  pageSubtitle?: string;
  breadcrumb?: Array<{ label: string; href?: string }>;
}

export function escapeHtml(s: string | number | null | undefined): string {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}


/**
 * Mini icon library — inline SVG strings (Lucide-style).
 */
const ICONS: Record<string, string> = {
  dashboard: `<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>`,
  package: `<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>`,
  bag: `<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>`,
  trending_up: `<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>`,
  calendar: `<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>`,
  archive: `<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>`,
  clock: `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`,
  check: `<polyline points="20 6 9 17 4 12"/>`,
  x: `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`,
  alert: `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`,
  refresh: `<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>`,
  plus: `<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>`,
  arrow_left: `<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>`,
  external: `<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>`,
  logout: `<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>`,
  bot: `<rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/>`,
  zap: `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`,
  user: `<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`,
  database: `<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>`,
  chart: `<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="3" y1="20" x2="21" y2="20"/>`,
  sparkles: `<path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/><path d="M19 3l.7 2.3L22 6l-2.3.7L19 9l-.7-2.3L16 6l2.3-.7z"/>`,
  menu: `<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>`,
  search: `<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>`,
  bell: `<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>`,
  settings: `<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>`,
  home: `<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>`,
};

export function icon(name: string, cls = "w-4 h-4"): string {
  const path = ICONS[name];
  if (!path) return "";
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}


const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect x='3' y='11' width='18' height='10' rx='2' fill='%2322d3ee'/%3E%3Ccircle cx='12' cy='5' r='2' fill='%23a78bfa'/%3E%3C/svg%3E";

/** Shared <head> with modern fonts, Tailwind, and enhanced theme. */
function commonHead(title: string): string {
  return `<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>${escapeHtml(title)} · botnot</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com/3.4.17"></script>
  <script src="https://unpkg.com/htmx.org@2.0.4"></script>
  <link rel="icon" href="${FAVICON}" />
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
          },
          animation: {
            'fade-in': 'fadeIn 0.3s ease-out',
            'slide-up': 'slideUp 0.3s ease-out',
            'slide-down': 'slideDown 0.2s ease-out',
            'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          },
          keyframes: {
            fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
            slideUp: { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
            slideDown: { '0%': { opacity: '0', transform: 'translateY(-10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
          },
        },
      },
    };
  </script>
  <style>
    html { font-feature-settings: 'cv11', 'ss01', 'ss03'; }
    body { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
    code, pre, .font-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
    [hx-confirm] { cursor: pointer; }
    .bg-grid {
      background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.015) 1px, transparent 0);
      background-size: 32px 32px;
    }
    .bg-noise {
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.02'/%3E%3C/svg%3E");
    }
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #334155; }
    ::selection { background: rgba(34,211,238,0.2); color: #ecfeff; }
    .glass { background: rgba(15,23,42,0.7); backdrop-filter: blur(12px) saturate(180%); -webkit-backdrop-filter: blur(12px) saturate(180%); }
    .card-glass { background: rgba(15,23,42,0.5); backdrop-filter: blur(8px); border: 1px solid rgba(51,65,85,0.5); }
    input:focus, textarea:focus, select:focus { box-shadow: 0 0 0 3px rgba(34,211,238,0.1); }
    .animate-in { animation: slideUp 0.3s ease-out both; }
    @media (prefers-reduced-motion: reduce) { .animate-in, [class*="animate-"] { animation: none !important; } }
    /* Mobile menu */
    #mobile-menu { display: none; }
    #mobile-menu.open { display: flex; }
  </style>
</head>`;
}


export function layout({
  title,
  body,
  active,
  flash,
  pageTitle,
  pageSubtitle,
  breadcrumb,
}: LayoutOptions): string {
  const navItem = (
    id: NonNullable<LayoutOptions["active"]>,
    href: string,
    label: string,
    iconName: string,
  ) => {
    const isActive = active === id;
    return `
    <a href="${href}" class="group relative flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive
        ? "bg-gradient-to-r from-cyan-500/10 to-violet-500/10 text-white ring-1 ring-cyan-500/20 shadow-sm shadow-cyan-500/5"
        : "text-slate-400 hover:text-white hover:bg-white/5"
    }">
      <span class="${isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300 transition-colors"}">${icon(iconName, "w-[18px] h-[18px]")}</span>
      <span>${label}</span>
      ${isActive ? `<span class="absolute -bottom-px left-3 right-3 h-px bg-gradient-to-r from-cyan-400/60 via-violet-400/60 to-transparent"></span>` : ""}
    </a>`;
  };

  const mobileNavItem = (
    id: NonNullable<LayoutOptions["active"]>,
    href: string,
    label: string,
    iconName: string,
  ) => {
    const isActive = active === id;
    return `
    <a href="${href}" class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? "bg-gradient-to-r from-cyan-500/10 to-violet-500/10 text-white ring-1 ring-cyan-500/20"
        : "text-slate-400 hover:text-white hover:bg-white/5"
    }">
      <span class="${isActive ? "text-cyan-400" : "text-slate-500"}">${icon(iconName, "w-5 h-5")}</span>
      <span>${label}</span>
    </a>`;
  };


  const flashHtml = flash
    ? `<div class="mb-6 rounded-xl border px-4 py-3.5 text-sm flex items-start gap-3 animate-slide-down ${
        flash.kind === "success"
          ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-200"
          : flash.kind === "error"
            ? "border-red-500/30 bg-red-500/5 text-red-200"
            : "border-cyan-500/30 bg-cyan-500/5 text-cyan-200"
      }">
        <span class="shrink-0 mt-0.5">${icon(flash.kind === "success" ? "check" : flash.kind === "error" ? "alert" : "zap", "w-4 h-4")}</span>
        <span class="flex-1">${escapeHtml(flash.message)}</span>
      </div>`
    : "";

  const breadcrumbHtml =
    breadcrumb && breadcrumb.length > 0
      ? `<nav class="flex items-center gap-2 text-xs text-slate-500 mb-3">
        ${breadcrumb
          .map((b, i) => {
            const isLast = i === breadcrumb.length - 1;
            const sep = i > 0 ? `<span class="text-slate-700">/</span>` : "";
            const item =
              b.href && !isLast
                ? `<a href="${escapeHtml(b.href)}" class="hover:text-cyan-400 transition-colors">${escapeHtml(b.label)}</a>`
                : `<span class="${isLast ? "text-slate-300 font-medium" : ""}">${escapeHtml(b.label)}</span>`;
            return sep + item;
          })
          .join("")}
      </nav>`
      : "";

  const pageHeader = pageTitle
    ? `<div class="mb-8 animate-in">
        ${breadcrumbHtml}
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight text-white">${escapeHtml(pageTitle)}</h1>
        ${pageSubtitle ? `<p class="text-slate-400 text-sm mt-2 max-w-lg">${escapeHtml(pageSubtitle)}</p>` : ""}
      </div>`
    : "";


  return `<!DOCTYPE html>
<html lang="id">
${commonHead(title)}
<body class="bg-[#0a0e1a] text-slate-100 min-h-screen bg-grid bg-noise">
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <header class="glass border-b border-white/[0.06] sticky top-0 z-30">
      <div class="max-w-[1400px] mx-auto px-4 md:px-6 h-16 flex items-center gap-4">
        <!-- Logo -->
        <a href="/admin" class="flex items-center gap-2.5 group shrink-0">
          <span class="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-cyan-500 to-violet-500 grid place-items-center text-slate-950 group-hover:scale-105 transition-transform shadow-lg shadow-cyan-500/20">
            ${icon("bot", "w-5 h-5")}
          </span>
          <span class="font-bold text-lg tracking-tight hidden sm:block">
            <span class="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">bot</span><span class="bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">not</span>
          </span>
        </a>

        <!-- Desktop Nav -->
        <nav class="hidden md:flex items-center gap-1 ml-6">
          ${navItem("home", "/admin", "Dashboard", "home")}
          ${navItem("products", "/admin/products", "Produk", "package")}
          ${navItem("orders", "/admin/orders", "Order", "bag")}
          ${navItem("analytics", "/admin/analytics", "Analytics", "chart")}
        </nav>

        <!-- Right side -->
        <div class="ml-auto flex items-center gap-2">
          <a href="/setup" class="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 hover:text-cyan-300 transition-colors px-3 py-2 rounded-lg hover:bg-white/5" title="Setup wizard">
            ${icon("settings", "w-3.5 h-3.5")} Setup
          </a>
          <form method="POST" action="/admin/logout">
            <button class="flex items-center gap-2 text-sm text-slate-400 hover:text-red-300 px-3 py-2 rounded-lg hover:bg-red-500/5 transition-colors">
              ${icon("logout", "w-4 h-4")} <span class="hidden sm:inline">Logout</span>
            </button>
          </form>
          <!-- Mobile menu button -->
          <button onclick="document.getElementById('mobile-menu').classList.toggle('open')" class="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            ${icon("menu", "w-5 h-5")}
          </button>
        </div>
      </div>


      <!-- Mobile Nav Menu -->
      <div id="mobile-menu" class="md:hidden flex-col gap-1 px-4 pb-4 border-t border-white/[0.04] pt-3">
        ${mobileNavItem("home", "/admin", "Dashboard", "home")}
        ${mobileNavItem("products", "/admin/products", "Produk", "package")}
        ${mobileNavItem("orders", "/admin/orders", "Order", "bag")}
        ${mobileNavItem("analytics", "/admin/analytics", "Analytics", "chart")}
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 max-w-[1400px] w-full mx-auto px-4 md:px-6 py-6 md:py-8">
      ${pageHeader}
      ${flashHtml}
      <div class="animate-in" style="animation-delay: 0.05s">
        ${body}
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-white/[0.04] mt-auto">
      <div class="max-w-[1400px] mx-auto px-4 md:px-6 py-4 text-xs text-slate-600 flex items-center justify-between">
        <span class="flex items-center gap-2">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-slow"></span>
          botnot · auto-order bot
        </span>
        <span class="font-mono">v0.1.0</span>
      </div>
    </footer>
  </div>
</body>
</html>`;
}


export function loginLayout(opts: { error?: string }): string {
  return `<!DOCTYPE html>
<html lang="id">
${commonHead("Login")}
<body class="bg-[#0a0e1a] text-slate-100 min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
  <div class="absolute inset-0 bg-grid bg-noise pointer-events-none"></div>
  <!-- Ambient glow -->
  <div class="absolute inset-0 pointer-events-none">
    <div class="absolute top-0 left-1/4 w-[600px] h-[400px] bg-cyan-500/[0.07] rounded-full blur-[120px]"></div>
    <div class="absolute bottom-0 right-1/4 w-[500px] h-[350px] bg-violet-500/[0.07] rounded-full blur-[120px]"></div>
  </div>

  <div class="w-full max-w-[380px] relative z-10 animate-in">
    <div class="flex items-center justify-center gap-3 mb-8">
      <span class="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 via-cyan-500 to-violet-500 grid place-items-center text-slate-950 shadow-2xl shadow-cyan-500/25">
        ${icon("bot", "w-8 h-8")}
      </span>
    </div>
    <div class="text-center mb-8">
      <div class="font-bold text-2xl text-white leading-none tracking-tight">
        <span>bot</span><span class="bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">not</span>
      </div>
      <div class="text-xs text-slate-500 mt-2">admin dashboard</div>
    </div>

    <form method="POST" action="/admin/login" class="card-glass rounded-2xl p-7 shadow-2xl shadow-black/40">
      <h1 class="text-lg font-semibold mb-1 tracking-tight text-white">Selamat datang</h1>
      <p class="text-slate-400 text-sm mb-6">Masuk untuk mengelola toko kamu.</p>
      ${
        opts.error
          ? `<div class="mb-4 rounded-xl border border-red-500/30 bg-red-500/5 text-red-300 text-sm px-4 py-3 flex items-center gap-2.5 animate-slide-down">${icon("alert", "w-4 h-4 shrink-0")}<span>${escapeHtml(opts.error)}</span></div>`
          : ""
      }
      <label class="block text-xs uppercase tracking-wider text-slate-500 mb-1.5 font-medium">Username</label>
      <input name="username" required autofocus autocomplete="username"
        class="w-full bg-slate-950/60 border border-slate-700/50 rounded-xl px-4 py-2.5 mb-4 focus:border-cyan-500/50 focus:outline-none transition-all placeholder:text-slate-600" placeholder="admin" />
      <label class="block text-xs uppercase tracking-wider text-slate-500 mb-1.5 font-medium">Password</label>
      <input name="password" type="password" required autocomplete="current-password"
        class="w-full bg-slate-950/60 border border-slate-700/50 rounded-xl px-4 py-2.5 mb-6 focus:border-cyan-500/50 focus:outline-none transition-all placeholder:text-slate-600" placeholder="••••••••" />
      <button class="w-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 active:scale-[0.98] transition-all rounded-xl px-4 py-2.5 font-semibold shadow-lg shadow-cyan-500/20 text-white">
        Masuk
      </button>
    </form>

    <p class="text-center text-xs text-slate-600 mt-6">
      Belum config? <a href="/setup" class="text-cyan-400 hover:text-cyan-300 transition-colors">Buka setup wizard</a>
    </p>
  </div>
</body>
</html>`;
}
