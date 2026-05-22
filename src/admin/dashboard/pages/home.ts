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


  const statCard = (
    label: string,
    value: string,
    iconName: string,
    gradient: string,
    textColor: string,
    delay: string,
  ) => `
    <div class="group relative card-glass rounded-2xl p-5 overflow-hidden hover:border-slate-600/50 transition-all duration-300 animate-in" style="animation-delay: ${delay}">
      <div class="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-[0.07] blur-2xl bg-gradient-to-br ${gradient} group-hover:opacity-[0.12] transition-opacity"></div>
      <div class="flex items-start justify-between mb-3 relative">
        <span class="text-[11px] uppercase tracking-wider text-slate-500 font-medium">${label}</span>
        <span class="${textColor} opacity-80">${icon(iconName, "w-4 h-4")}</span>
      </div>
      <div class="text-2xl font-bold ${textColor} relative tabular-nums tracking-tight">${value}</div>
    </div>`;

  const miniStat = (label: string, value: string, dotColor: string, valueColor: string) => `
    <div class="card-glass rounded-xl px-4 py-3 flex items-center gap-3 hover:border-slate-600/50 transition-all duration-200">
      <span class="w-2.5 h-2.5 rounded-full ${dotColor} shrink-0"></span>
      <div class="flex-1 min-w-0">
        <div class="text-[10px] uppercase tracking-wider text-slate-500 font-medium leading-none">${label}</div>
        <div class="text-lg font-bold ${valueColor} mt-0.5 tabular-nums">${value}</div>
      </div>
    </div>`;


  const body = `
    <!-- Revenue Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-5">
      ${statCard("Hari Ini", formatIDR(stats.revenueToday), "trending_up", "from-emerald-400 to-emerald-600", "text-emerald-400", "0.05s")}
      ${statCard("7 Hari", formatIDR(stats.revenue7d), "calendar", "from-cyan-400 to-cyan-600", "text-cyan-400", "0.1s")}
      ${statCard("Total Revenue", formatIDR(stats.revenueAllTime), "bag", "from-violet-400 to-violet-600", "text-violet-400", "0.15s")}
      ${statCard("Stok Tersedia", String(stats.stockAvailable), "archive", "from-amber-400 to-amber-600", "text-amber-400", "0.2s")}
    </div>

    <!-- Order Status Summary -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
      ${miniStat("Total Order", String(stats.totalOrders), "bg-slate-400", "text-slate-100")}
      ${miniStat("Pending", String(stats.pending), "bg-amber-400 shadow-sm shadow-amber-400/30", "text-amber-200")}
      ${miniStat("Paid", String(stats.paid), "bg-emerald-400 shadow-sm shadow-emerald-400/30", "text-emerald-200")}
      ${miniStat("Expired", String(stats.expired), "bg-red-400 shadow-sm shadow-red-400/30", "text-red-200")}
    </div>

    <!-- Recent Orders Table -->
    <div class="card-glass rounded-2xl overflow-hidden">
      <div class="px-5 md:px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <span class="w-8 h-8 rounded-lg bg-cyan-500/10 grid place-items-center">
            <span class="text-cyan-400">${icon("clock", "w-4 h-4")}</span>
          </span>
          <div>
            <h2 class="font-semibold text-white text-sm">Order Terbaru</h2>
            ${recent.length > 0 ? `<span class="text-xs text-slate-500">${recent.length} terakhir</span>` : ""}
          </div>
        </div>
        <a href="/admin/orders" class="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-cyan-500/5">
          Lihat semua ${icon("external", "w-3 h-3")}
        </a>
      </div>
      ${
        recent.length === 0
          ? renderEmptyState("Belum ada order", "Order pertama akan muncul setelah pembeli scan QRIS.", "bag")
          : `<div class="overflow-x-auto"><table class="w-full text-sm">
              <thead>
                <tr class="border-b border-white/[0.04]">
                  <th class="text-left px-5 md:px-6 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-medium">Order ID</th>
                  <th class="text-left px-5 md:px-6 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-medium">Produk</th>
                  <th class="text-left px-5 md:px-6 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-medium">Total</th>
                  <th class="text-left px-5 md:px-6 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-medium">Status</th>
                  <th class="text-left px-5 md:px-6 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-medium">Platform</th>
                  <th class="text-left px-5 md:px-6 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-medium">Waktu</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/[0.04]">
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
  const platformBadge = o.platform === "TELEGRAM"
    ? `<span class="inline-flex items-center gap-1.5 text-xs">
        <span class="w-5 h-5 rounded-md grid place-items-center bg-cyan-500/10 text-cyan-300 text-[10px] font-bold ring-1 ring-cyan-500/20">TG</span>
        <span class="text-slate-400">Telegram</span>
      </span>`
    : `<span class="inline-flex items-center gap-1.5 text-xs">
        <span class="w-5 h-5 rounded-md grid place-items-center bg-violet-500/10 text-violet-300 text-[10px] font-bold ring-1 ring-violet-500/20">DC</span>
        <span class="text-slate-400">Discord</span>
      </span>`;
  return `
    <tr class="hover:bg-white/[0.02] transition-colors">
      <td class="px-5 md:px-6 py-3.5 font-mono text-xs text-slate-400">${escapeHtml(o.id)}</td>
      <td class="px-5 md:px-6 py-3.5 text-slate-200 font-medium">${escapeHtml(o.product.name)}</td>
      <td class="px-5 md:px-6 py-3.5 font-medium text-white tabular-nums">${escapeHtml(formatIDR(o.totalAmount))}</td>
      <td class="px-5 md:px-6 py-3.5">${statusBadge}</td>
      <td class="px-5 md:px-6 py-3.5">${platformBadge}</td>
      <td class="px-5 md:px-6 py-3.5 text-slate-500 text-xs whitespace-nowrap tabular-nums">${escapeHtml(o.createdAt.toISOString().slice(0, 19).replace("T", " "))}</td>
    </tr>`;
}

export function renderStatusBadge(status: string): string {
  const map: Record<string, { dot: string; cls: string; label: string }> = {
    PENDING: {
      dot: "bg-amber-400 shadow-sm shadow-amber-400/40",
      cls: "bg-amber-500/10 text-amber-200 border-amber-500/20",
      label: "Pending",
    },
    PAID: {
      dot: "bg-emerald-400 shadow-sm shadow-emerald-400/40",
      cls: "bg-emerald-500/10 text-emerald-200 border-emerald-500/20",
      label: "Paid",
    },
    SUCCESS: {
      dot: "bg-emerald-400 shadow-sm shadow-emerald-400/40",
      cls: "bg-emerald-500/10 text-emerald-200 border-emerald-500/20",
      label: "Success",
    },
    EXPIRED: {
      dot: "bg-red-400 shadow-sm shadow-red-400/40",
      cls: "bg-red-500/10 text-red-200 border-red-500/20",
      label: "Expired",
    },
    FAILED: {
      dot: "bg-red-400 shadow-sm shadow-red-400/40",
      cls: "bg-red-500/10 text-red-200 border-red-500/20",
      label: "Failed",
    },
  };
  const s = map[status] ?? {
    dot: "bg-slate-400",
    cls: "bg-slate-700/50 text-slate-300 border-slate-600/50",
    label: status,
  };
  return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border font-medium ${s.cls}">
    <span class="w-1.5 h-1.5 rounded-full ${s.dot}"></span>
    ${escapeHtml(s.label)}
  </span>`;
}

export function renderEmptyState(title: string, subtitle: string, iconName: string): string {
  return `<div class="px-5 py-16 text-center">
    <div class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-800/40 border border-white/[0.06] grid place-items-center text-slate-500">
      ${icon(iconName, "w-6 h-6")}
    </div>
    <div class="text-slate-300 font-medium text-sm">${escapeHtml(title)}</div>
    <div class="text-slate-500 text-xs mt-1.5 max-w-xs mx-auto leading-relaxed">${escapeHtml(subtitle)}</div>
  </div>`;
}
