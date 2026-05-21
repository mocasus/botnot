import type { AnalyticsData } from "../../analytics.js";
import { formatIDR } from "../../service.js";
import { escapeHtml, icon, layout } from "../layout.js";
import { renderEmptyState } from "./home.js";

export function renderAnalytics(data: AnalyticsData): string {
  const { revenueByDay, topProducts, byStatus, byPlatform, totals } = data;

  const failurePct = (totals.deliveryFailureRate * 100).toFixed(1);

  const statRow = `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      ${statCard("Revenue 30 Hari", formatIDR(totals.revenue30d), "trending_up", "from-emerald-400 to-emerald-600", "text-emerald-300")}
      ${statCard("Order 30 Hari", String(totals.orders30d), "bag", "from-cyan-400 to-cyan-600", "text-cyan-300")}
      ${statCard("Avg Order Value", formatIDR(totals.avgOrderValue), "calendar", "from-violet-400 to-violet-600", "text-violet-300")}
      ${statCard("Delivery Failure", `${failurePct}%`, "alert", "from-amber-400 to-amber-600", totals.deliveryFailureRate > 0.05 ? "text-red-300" : "text-amber-300")}
    </div>`;

  const chartCard = `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-6">
      <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <span class="text-emerald-400">${icon("trending_up", "w-4 h-4")}</span>
          <h2 class="font-semibold">Revenue 30 Hari Terakhir</h2>
        </div>
        <span class="text-xs text-slate-500">Total: <span class="text-emerald-300 font-medium">${formatIDR(totals.revenue30d)}</span></span>
      </div>
      <div class="p-6">${renderRevenueChart(revenueByDay)}</div>
    </div>`;

  const topProductsCard = `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-800 flex items-center gap-2.5">
        <span class="text-violet-400">${icon("package", "w-4 h-4")}</span>
        <h2 class="font-semibold">Top Produk</h2>
        <span class="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">${topProducts.length}</span>
      </div>
      ${
        topProducts.length === 0
          ? renderEmptyState("Belum ada penjualan", "Top produk akan muncul setelah ada order PAID.", "package")
          : `<div class="divide-y divide-slate-800/50">
            ${topProducts.map((p, i) => renderTopProduct(p, i, topProducts[0]?.revenue ?? 1)).join("")}
          </div>`
      }
    </div>`;

  const breakdownCard = `
    <div class="grid md:grid-cols-2 gap-6">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-800 flex items-center gap-2.5">
          <span class="text-cyan-400">${icon("clock", "w-4 h-4")}</span>
          <h3 class="font-semibold">Distribusi Status</h3>
        </div>
        <div class="p-6">${renderStatusBreakdown(byStatus)}</div>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-800 flex items-center gap-2.5">
          <span class="text-amber-400">${icon("bot", "w-4 h-4")}</span>
          <h3 class="font-semibold">Penjualan per Platform</h3>
        </div>
        <div class="p-6">${renderPlatformBreakdown(byPlatform)}</div>
      </div>
    </div>`;

  const body = `
    ${statRow}
    ${chartCard}
    <div class="grid lg:grid-cols-5 gap-6 mb-6">
      <div class="lg:col-span-3">${topProductsCard}</div>
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-800 flex items-center gap-2.5">
            <span class="text-cyan-400">${icon("clock", "w-4 h-4")}</span>
            <h3 class="font-semibold">Status Order</h3>
          </div>
          <div class="p-6">${renderStatusBreakdown(byStatus)}</div>
        </div>
        <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-800 flex items-center gap-2.5">
            <span class="text-amber-400">${icon("bot", "w-4 h-4")}</span>
            <h3 class="font-semibold">Per Platform</h3>
          </div>
          <div class="p-6">${renderPlatformBreakdown(byPlatform)}</div>
        </div>
      </div>
    </div>
  `;

  return layout({
    title: "Analytics",
    body,
    active: "analytics",
    pageTitle: "Analytics",
    pageSubtitle: "Insight penjualan dan performa toko 30 hari terakhir",
  });
}

function statCard(label: string, value: string, iconName: string, gradient: string, textColor: string): string {
  return `
    <div class="group relative bg-slate-900 border border-slate-800 rounded-2xl p-5 overflow-hidden hover:border-slate-700 transition">
      <div class="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-10 blur-2xl bg-gradient-to-br ${gradient}"></div>
      <div class="flex items-start justify-between mb-3 relative">
        <span class="text-[11px] uppercase tracking-wider text-slate-500 font-medium">${label}</span>
        <span class="${textColor}">${icon(iconName, "w-4 h-4")}</span>
      </div>
      <div class="text-2xl font-bold ${textColor} relative tabular-nums">${value}</div>
    </div>`;
}

function renderRevenueChart(days: Array<{ date: string; revenue: number; orders: number }>): string {
  if (days.every((d) => d.revenue === 0)) {
    return `<div class="py-12">${renderEmptyState("Belum ada data", "Chart akan muncul setelah ada order PAID dalam 30 hari terakhir.", "trending_up")}</div>`;
  }

  const W = 800;
  const H = 240;
  const padX = 40;
  const padTop = 20;
  const padBot = 30;
  const innerW = W - padX * 2;
  const innerH = H - padTop - padBot;

  const max = Math.max(...days.map((d) => d.revenue), 1);
  const xStep = innerW / (days.length - 1 || 1);

  const points = days.map((d, i) => {
    const x = padX + i * xStep;
    const y = padTop + innerH - (d.revenue / max) * innerH;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1]!.x.toFixed(1)},${(padTop + innerH).toFixed(1)} L${points[0]!.x.toFixed(1)},${(padTop + innerH).toFixed(1)} Z`;

  // Y-axis labels (4 ticks: 0, 25%, 50%, 75%, 100%)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((p) => ({
    y: padTop + innerH - p * innerH,
    label: formatCompact(max * p),
  }));

  // X-axis labels (every 5th day)
  const xTicks = points.filter((_, i) => i % 5 === 0 || i === points.length - 1);

  const dots = points
    .map(
      (p) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3"
      class="fill-emerald-400 opacity-0 hover:opacity-100 transition" >
      <title>${escapeHtml(p.date)}: ${formatIDR(p.revenue)} (${p.orders} order)</title>
    </circle>`,
    )
    .join("");

  return `
    <svg viewBox="0 0 ${W} ${H}" class="w-full h-auto" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#34d399" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#34d399" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${yTicks
        .map(
          (t) => `
          <line x1="${padX}" y1="${t.y}" x2="${W - padX}" y2="${t.y}" stroke="#1e293b" stroke-dasharray="2,4"/>
          <text x="${padX - 8}" y="${t.y + 3}" text-anchor="end" font-size="10" fill="#64748b">${escapeHtml(t.label)}</text>`,
        )
        .join("")}
      <path d="${areaPath}" fill="url(#areaGradient)"/>
      <path d="${linePath}" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      ${dots}
      ${xTicks
        .map(
          (p) => `<text x="${p.x}" y="${H - 8}" text-anchor="middle" font-size="10" fill="#64748b">${escapeHtml(p.date.slice(5))}</text>`,
        )
        .join("")}
    </svg>`;
}

function renderTopProduct(
  p: { productId: string; name: string; revenue: number; sold: number },
  i: number,
  maxRevenue: number,
): string {
  const pct = maxRevenue > 0 ? (p.revenue / maxRevenue) * 100 : 0;
  const rank = i + 1;
  const rankColor =
    rank === 1
      ? "text-amber-300 bg-amber-500/15 border-amber-500/30"
      : rank === 2
        ? "text-slate-200 bg-slate-500/15 border-slate-500/30"
        : rank === 3
          ? "text-orange-300 bg-orange-500/15 border-orange-500/30"
          : "text-slate-400 bg-slate-700/40 border-slate-600";
  return `
    <div class="px-6 py-3 hover:bg-slate-800/30 transition">
      <div class="flex items-center gap-3 mb-2">
        <span class="w-7 h-7 rounded-lg border ${rankColor} grid place-items-center text-xs font-bold tabular-nums">${rank}</span>
        <div class="flex-1 min-w-0">
          <div class="font-medium text-slate-100 truncate">${escapeHtml(p.name)}</div>
          <div class="text-xs text-slate-500 font-mono">${escapeHtml(p.productId)}</div>
        </div>
        <div class="text-right whitespace-nowrap">
          <div class="font-semibold text-emerald-300 tabular-nums">${escapeHtml(formatIDR(p.revenue))}</div>
          <div class="text-xs text-slate-500">${p.sold} terjual</div>
        </div>
      </div>
      <div class="h-1.5 bg-slate-800 rounded-full overflow-hidden ml-10">
        <div class="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all" style="width: ${pct.toFixed(0)}%"></div>
      </div>
    </div>`;
}

function renderStatusBreakdown(items: Array<{ status: string; count: number }>): string {
  if (items.length === 0) return `<div class="text-sm text-slate-500 text-center py-4">Belum ada data</div>`;
  const total = items.reduce((a, b) => a + b.count, 0);
  const colors: Record<string, { bar: string; text: string }> = {
    PENDING: { bar: "bg-amber-500", text: "text-amber-300" },
    PAID: { bar: "bg-emerald-500", text: "text-emerald-300" },
    EXPIRED: { bar: "bg-red-500", text: "text-red-300" },
    FAILED: { bar: "bg-red-500", text: "text-red-300" },
  };
  return `<div class="space-y-3">
    ${items
      .map((it) => {
        const c = colors[it.status] ?? { bar: "bg-slate-500", text: "text-slate-300" };
        const pct = total > 0 ? (it.count / total) * 100 : 0;
        return `<div>
          <div class="flex items-center justify-between text-xs mb-1.5">
            <span class="${c.text} font-medium">${escapeHtml(it.status)}</span>
            <span class="text-slate-500 tabular-nums">${it.count} <span class="text-slate-700">(${pct.toFixed(0)}%)</span></span>
          </div>
          <div class="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div class="h-full ${c.bar} rounded-full transition-all" style="width: ${pct.toFixed(0)}%"></div>
          </div>
        </div>`;
      })
      .join("")}
  </div>`;
}

function renderPlatformBreakdown(items: Array<{ platform: string; count: number; revenue: number }>): string {
  if (items.length === 0) return `<div class="text-sm text-slate-500 text-center py-4">Belum ada penjualan</div>`;
  const totalRev = items.reduce((a, b) => a + b.revenue, 0) || 1;
  return `<div class="space-y-4">
    ${items
      .map((it) => {
        const isTg = it.platform === "TELEGRAM";
        const accent = isTg ? "from-cyan-500 to-cyan-600" : "from-violet-500 to-violet-600";
        const textColor = isTg ? "text-cyan-300" : "text-violet-300";
        const bgColor = isTg ? "bg-cyan-500/15" : "bg-violet-500/15";
        const pct = (it.revenue / totalRev) * 100;
        return `<div>
          <div class="flex items-center justify-between mb-1.5">
            <span class="inline-flex items-center gap-2 ${textColor} text-sm font-medium">
              <span class="w-6 h-6 rounded ${bgColor} grid place-items-center text-[10px] font-bold">${isTg ? "TG" : "DC"}</span>
              ${escapeHtml(it.platform)}
            </span>
            <span class="font-semibold tabular-nums ${textColor}">${escapeHtml(formatIDR(it.revenue))}</span>
          </div>
          <div class="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r ${accent} rounded-full transition-all" style="width: ${pct.toFixed(0)}%"></div>
          </div>
          <div class="text-xs text-slate-500 mt-1 tabular-nums">${it.count} order</div>
        </div>`;
      })
      .join("")}
  </div>`;
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return Math.round(n).toString();
}
