interface LayoutOptions {
  title: string;
  body: string;
  active?: "home" | "products" | "stock" | "orders";
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
 * Pakai: icon("name", "w-5 h-5")
 */
const ICONS: Record<string, string> = {
  dashboard: `<path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>`,
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
};

export function icon(name: string, cls = "w-4 h-4"): string {
  const path = ICONS[name];
  if (!path) return "";
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
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
    <a href="${href}" class="group flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
      isActive
        ? "bg-gradient-to-r from-cyan-500/15 to-violet-500/10 text-cyan-300 ring-1 ring-cyan-500/20"
        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
    }">
      <span class="${isActive ? "text-cyan-300" : "text-slate-500 group-hover:text-slate-300"}">${icon(iconName, "w-4 h-4")}</span>
      ${label}
    </a>`;
  };

  const flashHtml = flash
    ? `<div class="mb-6 rounded-xl border px-4 py-3 text-sm flex items-start gap-3 ${
        flash.kind === "success"
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
          : flash.kind === "error"
            ? "border-red-500/40 bg-red-500/10 text-red-200"
            : "border-cyan-500/40 bg-cyan-500/10 text-cyan-200"
      }">
        <span class="shrink-0 mt-0.5">${icon(flash.kind === "success" ? "check" : flash.kind === "error" ? "alert" : "zap", "w-4 h-4")}</span>
        <span>${escapeHtml(flash.message)}</span>
      </div>`
    : "";

  const breadcrumbHtml = breadcrumb && breadcrumb.length > 0
    ? `<nav class="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
        ${breadcrumb
          .map((b, i) => {
            const isLast = i === breadcrumb.length - 1;
            const sep = i > 0 ? `<span class="text-slate-700">/</span>` : "";
            const item = b.href && !isLast
              ? `<a href="${escapeHtml(b.href)}" class="hover:text-slate-300 transition">${escapeHtml(b.label)}</a>`
              : `<span class="${isLast ? "text-slate-300" : ""}">${escapeHtml(b.label)}</span>`;
            return sep + item;
          })
          .join("")}
      </nav>`
    : "";

  const pageHeader = pageTitle
    ? `<div class="mb-8">
        ${breadcrumbHtml}
        <h1 class="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">${escapeHtml(pageTitle)}</h1>
        ${pageSubtitle ? `<p class="text-slate-400 text-sm mt-1.5">${escapeHtml(pageSubtitle)}</p>` : ""}
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>${escapeHtml(title)} · botnot</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/htmx.org@1.9.12"></script>
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect x='3' y='11' width='18' height='10' rx='2' fill='%2322d3ee'/%3E%3Ccircle cx='12' cy='5' r='2' fill='%23a78bfa'/%3E%3C/svg%3E" />
  <style>
    body { font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif; }
    [hx-confirm] { cursor: pointer; }
    /* Subtle grid pattern background */
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.025) 1px, transparent 0);
      background-size: 32px 32px;
      pointer-events: none;
      z-index: 0;
    }
    main, header { position: relative; z-index: 1; }
    /* Scrollbar polish */
    ::-webkit-scrollbar { width: 10px; height: 10px; }
    ::-webkit-scrollbar-track { background: #0f172a; }
    ::-webkit-scrollbar-thumb { background: #334155; border-radius: 5px; }
    ::-webkit-scrollbar-thumb:hover { background: #475569; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">
  <header class="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-20">
    <div class="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
      <a href="/admin" class="flex items-center gap-2.5 group">
        <span class="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 grid place-items-center text-slate-950 group-hover:scale-105 transition">
          ${icon("bot", "w-5 h-5")}
        </span>
        <span class="font-bold text-lg bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent tracking-tight">botnot</span>
      </a>
      <nav class="ml-6 flex gap-1">
        ${navItem("home", "/admin", "Dashboard", "dashboard")}
        ${navItem("products", "/admin/products", "Produk", "package")}
        ${navItem("orders", "/admin/orders", "Order", "bag")}
      </nav>
      <div class="ml-auto flex items-center gap-2">
        <a href="/setup" class="text-xs text-slate-500 hover:text-cyan-300 transition px-2 py-1.5 hidden sm:flex items-center gap-1.5" title="Buka setup wizard">
          ${icon("zap", "w-3.5 h-3.5")} Setup
        </a>
        <form method="POST" action="/admin/logout">
          <button class="flex items-center gap-2 text-sm text-slate-400 hover:text-red-300 px-3 py-2 rounded-lg hover:bg-red-500/10 transition">
            ${icon("logout", "w-4 h-4")} Logout
          </button>
        </form>
      </div>
    </div>
  </header>
  <main class="max-w-7xl mx-auto px-6 py-8">
    ${pageHeader}
    ${flashHtml}
    ${body}
  </main>
</body>
</html>`;
}

export function loginLayout(opts: { error?: string }): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Login · botnot admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect x='3' y='11' width='18' height='10' rx='2' fill='%2322d3ee'/%3E%3Ccircle cx='12' cy='5' r='2' fill='%23a78bfa'/%3E%3C/svg%3E" />
  <style>
    body { font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; }
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background:
        radial-gradient(ellipse at top left, rgba(34,211,238,0.08), transparent 50%),
        radial-gradient(ellipse at bottom right, rgba(167,139,250,0.08), transparent 50%);
      pointer-events: none;
    }
    body::after {
      content: '';
      position: fixed;
      inset: 0;
      background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.025) 1px, transparent 0);
      background-size: 32px 32px;
      pointer-events: none;
    }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center px-4 relative">
  <div class="w-full max-w-sm relative z-10">
    <div class="flex items-center justify-center gap-3 mb-6">
      <span class="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 grid place-items-center text-slate-950 shadow-lg shadow-cyan-500/20">
        ${icon("bot", "w-7 h-7")}
      </span>
      <div>
        <div class="font-bold text-2xl bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent leading-none">botnot</div>
        <div class="text-xs text-slate-500 mt-1">admin dashboard</div>
      </div>
    </div>

    <form method="POST" action="/admin/login" class="bg-slate-900/70 backdrop-blur-sm border border-slate-800 rounded-2xl p-7 shadow-2xl shadow-slate-950/50">
      <h1 class="text-xl font-semibold mb-1">Selamat datang kembali</h1>
      <p class="text-slate-400 text-sm mb-6">Masuk untuk mengelola toko kamu.</p>
      ${
        opts.error
          ? `<div class="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 text-sm px-4 py-3 flex items-center gap-2">${icon("alert", "w-4 h-4 shrink-0")}<span>${escapeHtml(opts.error)}</span></div>`
          : ""
      }
      <label class="block text-xs uppercase tracking-wide text-slate-500 mb-1.5">Username</label>
      <input name="username" required autofocus autocomplete="username"
        class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 mb-4 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition" />
      <label class="block text-xs uppercase tracking-wide text-slate-500 mb-1.5">Password</label>
      <input name="password" type="password" required autocomplete="current-password"
        class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 mb-6 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition" />
      <button class="w-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:opacity-90 active:scale-[0.99] transition rounded-lg px-4 py-2.5 font-medium shadow-lg shadow-cyan-500/20">Masuk</button>
    </form>

    <p class="text-center text-xs text-slate-600 mt-6">
      Belum config? <a href="/setup" class="text-cyan-400 hover:underline">Buka setup wizard</a>
    </p>
  </div>
</body>
</html>`;
}
