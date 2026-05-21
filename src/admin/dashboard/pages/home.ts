import type { AdminStats } from "../../service.js";
import { formatIDR } from "../../service.js";
import { escapeHtml, icon, layout } from "../layout.js";

interface RecentOrder {
  id: string;
  status: string;
  totalAmount: number | null;
  platform: string;
  username: string | null;
  createdAt: Date;
  product: { name: string };
}

export function renderHome(opts: { stats: AdminStats; recent: RecentOrder[] }): string {
  const { stats, recent } = opts;

  const primaryStat = (
    label: string,
    value: string,
    iconName: string,
    accent: { from: string; to: string; text: string },
  ) => `
    <div class="group relative bg-slate-900 border border-slate-800 rounded-xl p-5 overflow-hidden hover:border-slate-700 transition">
      <div class="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-10 blur-2xl bg-gradient-to-br ${accent.from} ${accent.to}"></div>
      <div class="flex items-start justify-between mb-3 relative">
        <span class="text-xs uppercase tracking-wider text-slate-500 font-medium">${label}</span>
        <span class="${accent.text}">${icon(iconName, "w-4 h-4")}</span>
      </div>
      <div class="text-2xl font-bold ${accent.text} relative">${value}</div>
    </div>`;

  const miniStat = (label: string, value: string, dotColor: string, valueColor: string) => `
    <div class="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-3 hover:border-slate-700 transition">
      <span class="w-2 h-2 rounded-full ${dotColor} shrink-0"></span>
      <div class="flex-1 min-w-0">
        <div class="text-[10px] uppercase tracking-wider text-slate-500 font-medium leading-none">${label}</div>
        <div class="text-lg font-semibold ${valueColor} mt-0.5">${value}</div>
      </div>
    </div>`;

  const body = `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
      ${primaryStat("Hari Ini", formatIDR(stats.revenueToday), "trending_up", { from: "from-emerald-400", to: "to-emerald-600", text: "text-emerald-400" })}
      ${primaryStat("7 Hari", formatIDR(stats.revenue7d), "calendar", { from: "from-cyan-400", to: "to-cyan-600", text: "text-cyan-400" })}
      ${primaryStat("Total Revenue", formatIDR(stats.revenueAllTime), "bag", { from: "from-violet-400", to: "to-violet-600", text: "text-violet-400" })}
      ${primaryStat("Stok Tersedia", String(stats.stockAvailable), "archive", { from: "from-amber-400", to: "to-amber-600", text: "text-amber-400" })}
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
      ${miniStat("Total Order", String(stats.totalOrders), "bg-slate-400", "text-slate-100")}
      ${miniStat("Pending", String(stats.pending), "bg-amber-400 ring-2 ring-amber-400/20", "text-amber-200")}
      ${miniStat("Paid", String(stats.paid), "bg-emerald-400 ring-2 ring-emerald-400/20", "text-emerald-200")}
      ${miniStat("Expired", String(stats.expired), "bg-red-400 ring-2 ring-red-400/20", "text-red-200")}
    </div>

    <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <span class="text-cyan-400">${icon("clock", "w-4 h-4")}</span>
          <h2 class="font-semibold">Order Terbaru</h2>
          ${recent.length > 0 ? `<span class="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">${recent.length}</span>` : ""}
        </div>
        <a href="/admin/orders" class="text-xs text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1">Lihat semua ${icon("external", "w-3 h-3")}</a>
      </div>
      ${
        recent.length === 0
          ? renderEmptyState("Belum ada order", "Order pertama akan muncul di sini setelah pembeli scan QRIS.", "bag")
          : `<div class="overflow-x-auto"><table class="w-full text-sm">
              <thead class="bg-slate-950/50 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th class="text-left px-5 py-3 font-medium">Order ID</th>
                  <th class="text-left px-5 py-3 font-medium">Produk</th>
                  <th class="text-left px-5 py-3 font-medium">Total</th>
                  <th class="text-left px-5 py-3 font-medium">Status</th>
                  <th class="text-left px-5 py-3 font-medium">Platform</th>
                  <th class="text-left px-5 py-3 font-medium">Waktu</th>
                </tr>
              </thead>
              <tbody>
                ${recent.map((o) => orderRow(o)).join("")}
              </tbody>
            </table></div>`
      }
    </div>
  `;

  return layout({
    title: "Dashboard",
    body,
    active: "home",
    pageTitle: "Dashboard",
    pageSubtitle: "Ringkasan penjualan dan aktivitas terbaru",
  });
}

function orderRow(o: RecentOrder): string {
  const statusBadge = renderStatusBadge(o.status);
  const platformIcon = o.platform === "TELEGRAM"
    ? `<span class="text-cyan-400/70 text-xs">TG</span>`
    : `<span class="text-violet-400/70 text-xs">DC</span>`;
  return `
    <tr class="border-t border-slate-800/50 hover:bg-slate-800/40 transition">
      <td class="px-5 py-3 font-mono text-xs text-slate-400">${escapeHtml(o.id)}</td>
      <td class="px-5 py-3 text-slate-200">${escapeHtml(o.product.name)}</td>
      <td class="px-5 py-3 font-medium">${escapeHtml(formatIDR(o.totalAmount))}</td>
      <td class="px-5 py-3">${statusBadge}</td>
      <td class="px-5 py-3">
        <span class="inline-flex items-center gap-1.5 text-slate-400 text-xs">
          ${platformIcon}
          <span>${escapeHtml(o.platform)}</span>
        </span>
      </td>
      <td class="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">${escapeHtml(o.createdAt.toISOString().slice(0, 19).replace("T", " "))}</td>
    </tr>`;
}

export function renderStatusBadge(status: string): string {
  const map: Record<string, { dot: string; cls: string; label: string }> = {
    PENDING: {
      dot: "bg-amber-400",
      cls: "bg-amber-500/10 text-amber-200 border-amber-500/30",
      label: "Pending",
    },
    PAID: {
      dot: "bg-emerald-400",
      cls: "bg-emerald-500/10 text-emerald-200 border-emerald-500/30",
      label: "Paid",
    },
    SUCCESS: {
      dot: "bg-emerald-400",
      cls: "bg-emerald-500/10 text-emerald-200 border-emerald-500/30",
      label: "Success",
    },
    EXPIRED: {
      dot: "bg-red-400",
      cls: "bg-red-500/10 text-red-200 border-red-500/30",
      label: "Expired",
    },
    FAILED: {
      dot: "bg-red-400",
      cls: "bg-red-500/10 text-red-200 border-red-500/30",
      label: "Failed",
    },
  };
  const s = map[status] ?? {
    dot: "bg-slate-400",
    cls: "bg-slate-700 text-slate-300 border-slate-600",
    label: status,
  };
  return `<span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border font-medium ${s.cls}">
    <span class="w-1.5 h-1.5 rounded-full ${s.dot}"></span>
    ${escapeHtml(s.label)}
  </span>`;
}

export function renderEmptyState(title: string, subtitle: string, iconName: string): string {
  return `<div class="px-5 py-12 text-center">
    <div class="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-800/60 grid place-items-center text-slate-500">
      ${icon(iconName, "w-6 h-6")}
    </div>
    <div class="text-slate-300 font-medium text-sm">${escapeHtml(title)}</div>
    <div class="text-slate-500 text-xs mt-1 max-w-xs mx-auto">${escapeHtml(subtitle)}</div>
  </div>`;
}
