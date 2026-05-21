interface LayoutOptions {
  title: string;
  body: string;
  active?: "home" | "products" | "stock" | "orders";
  flash?: { kind: "success" | "error" | "info"; message: string } | null;
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

export function layout({ title, body, active, flash }: LayoutOptions): string {
  const navItem = (id: NonNullable<LayoutOptions["active"]>, href: string, label: string) => `
    <a href="${href}" class="px-3 py-2 rounded-lg text-sm font-medium ${
    active === id
      ? "bg-cyan-500/10 text-cyan-300"
      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
  }">${label}</a>
  `;

  const flashHtml = flash
    ? `<div class="mb-6 rounded-lg border px-4 py-3 text-sm ${
        flash.kind === "success"
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
          : flash.kind === "error"
            ? "border-red-500/40 bg-red-500/10 text-red-300"
            : "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
      }">${escapeHtml(flash.message)}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>${escapeHtml(title)} · botnot admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/htmx.org@1.9.12"></script>
  <style>
    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; }
    [hx-confirm] { cursor: pointer; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">
  <header class="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-10">
    <div class="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2">
      <a href="/admin" class="font-bold text-lg bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">botnot</a>
      <span class="text-slate-600">/</span>
      <span class="text-slate-400 text-sm">admin</span>
      <nav class="ml-6 flex gap-1">
        ${navItem("home", "/admin", "Dashboard")}
        ${navItem("products", "/admin/products", "Produk")}
        ${navItem("orders", "/admin/orders", "Order")}
      </nav>
      <form method="POST" action="/admin/logout" class="ml-auto">
        <button class="text-sm text-slate-400 hover:text-slate-100 px-3 py-2 rounded-lg hover:bg-slate-800">Logout</button>
      </form>
    </div>
  </header>
  <main class="max-w-6xl mx-auto px-4 py-8">
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
  <style>body{font-family:'Segoe UI',system-ui,sans-serif}</style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center px-4">
  <form method="POST" action="/admin/login" class="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
    <h1 class="text-2xl font-bold mb-1 bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">botnot admin</h1>
    <p class="text-slate-400 text-sm mb-6">Masuk untuk mengelola toko kamu.</p>
    ${
      opts.error
        ? `<div class="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 text-sm px-4 py-3">${escapeHtml(opts.error)}</div>`
        : ""
    }
    <label class="block text-sm font-medium mb-1">Username</label>
    <input name="username" required autofocus autocomplete="username"
      class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 mb-4 focus:border-cyan-500 focus:outline-none" />
    <label class="block text-sm font-medium mb-1">Password</label>
    <input name="password" type="password" required autocomplete="current-password"
      class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 mb-6 focus:border-cyan-500 focus:outline-none" />
    <button class="w-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:opacity-90 transition rounded-lg px-4 py-2 font-medium">Login</button>
  </form>
</body>
</html>`;
}
