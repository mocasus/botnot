import type { AdminStats } from "../../service.js";
import { formatIDR } from "../../service.js";
import { escapeHtml, layout } from "../layout.js";

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

  const statCard = (label: string, value: string, color: string) => `
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div class="text-xs uppercase tracking-wide text-slate-500 mb-2">${label}</div>
      <div class="text-2xl font-bold ${color}">${value}</div>
    </div>`;

  const body = `
    <h1 class="text-2xl font-bold mb-6">Dashboard</h1>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      ${statCard("Revenue Hari Ini", formatIDR(stats.revenueToday), "text-emerald-400")}
      ${statCard("Revenue 7 Hari", formatIDR(stats.revenue7d), "text-cyan-400")}
      ${statCard("Total Revenue", formatIDR(stats.revenueAllTime), "text-violet-400")}
      ${statCard("Stok Tersedia", String(stats.stockAvailable), "text-amber-400")}
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      ${statCard("Total Order", String(stats.totalOrders), "text-slate-100")}
      ${statCard("Pending", String(stats.pending), "text-amber-300")}
      ${statCard("Paid", String(stats.paid), "text-emerald-300")}
      ${statCard("Expired", String(stats.expired), "text-red-300")}
    </div>

    <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div class="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
        <h2 class="font-semibold">Order Terbaru</h2>
        <a href="/admin/orders" class="text-xs text-cyan-400 hover:underline">Lihat semua →</a>
      </div>
      ${
        recent.length === 0
          ? `<div class="px-5 py-8 text-center text-slate-500 text-sm">Belum ada order.</div>`
          : `<table class="w-full text-sm">
              <thead class="bg-slate-950/50 text-xs uppercase tracking-wide text-slate-500">
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
            </table>`
      }
    </div>
  `;

  return layout({ title: "Dashboard", body, active: "home" });
}

function orderRow(o: RecentOrder): string {
  const statusBadge = renderStatusBadge(o.status);
  return `
    <tr class="border-t border-slate-800/50 hover:bg-slate-800/30">
      <td class="px-5 py-3 font-mono text-xs">${escapeHtml(o.id)}</td>
      <td class="px-5 py-3">${escapeHtml(o.product.name)}</td>
      <td class="px-5 py-3">${escapeHtml(formatIDR(o.totalAmount))}</td>
      <td class="px-5 py-3">${statusBadge}</td>
      <td class="px-5 py-3 text-slate-400">${escapeHtml(o.platform)}</td>
      <td class="px-5 py-3 text-slate-500 text-xs">${escapeHtml(o.createdAt.toISOString().slice(0, 19).replace("T", " "))}</td>
    </tr>`;
}

export function renderStatusBadge(status: string): string {
  const map: Record<string, string> = {
    PENDING: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    PAID: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    EXPIRED: "bg-red-500/10 text-red-300 border-red-500/30",
    FAILED: "bg-red-500/10 text-red-300 border-red-500/30",
  };
  const cls = map[status] ?? "bg-slate-700 text-slate-300";
  return `<span class="inline-block px-2 py-1 rounded text-xs border ${cls}">${escapeHtml(status)}</span>`;
}
