import type { AnalyticsData } from "../../analytics.js";
import { formatIDR } from "../../service.js";
import { escapeHtml, icon, layout } from "../layout.js";
import { renderEmptyState } from "./home.js";

export function renderAnalytics(data: AnalyticsData): string {
  const { revenueByDay, topProducts, byStatus, byPlatform, totals } = data;
  const failurePct = (totals.deliveryFailureRate * 100).toFixed(1);


  const statRow = `
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
      ${statCard("Revenue 30 Hari", formatIDR(totals.revenue30d), "trending_up", "from-emerald-400 to-emerald-600", "text-emerald-400", "0.05s")}
      ${statCard("Order 30 Hari", String(totals.orders30d), "bag", "from-cyan-400 to-cyan-600", "text-cyan-400", "0.1s")}
      ${statCard("Avg Order Value", formatIDR(totals.avgOrderValue), "calendar", "from-violet-400 to-violet-600", "text-violet-400", "0.15s")}
      ${statCard("Delivery Failure", `${failurePct}%`, "alert", "from-amber-400 to-amber-600", totals.deliveryFailureRate > 0.05 ? "text-red-400" : "text-amber-400", "0.2s")}
    </div>`;

  const chartCard = `
    <div class="card-glass rounded-2xl overflow-hidden mb-6">
      <div class="px-5 md:px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <span class="w-8 h-8 rounded-lg bg-emerald-500/10 grid place-items-center">
            <span class="text-emerald-400">${icon("trending_up", "w-4 h-4")}</span>
          </span>
          <div>
            <h2 class="font-semibold text-white text-sm">Revenue 30 Hari Terakhir</h2>
            <span class="text-xs text-slate-500">Total: <span class="text-emerald-300 font-semibold">${formatIDR(totals.revenue30d)}</span></span>
          </div>
        </div>
      </div>
      <div class="p-5 md:p-6">${renderRevenueChart(revenueByDay)}</div>
    </div>`;


  const topProductsCard = `
    <div class="card-glass rounded-2xl overflow-hidden">
      <div class="px-5 md:px-6 py-4 border-b border-white/[0.06] flex items-center gap-2.5">
        <span class="w-8 h-8 rounded-lg bg-violet-500/10 grid place-items-center">
          <span class="text-violet-400">${icon("package", "w-4 h-4")}</span>
        </span>
        <div>
          <h2 class="font-semibold text-white text-sm">Top Produk</h2>
          <span class="text-xs text-slate-500">${topProducts.length} produk terlaris</span>
        </div>
      </div>
      ${
        topProducts.length === 0
          ? renderEmptyState("Belum ada penjualan", "Top produk akan muncul setelah ada order PAID.", "package")
          : `<div class="divide-y divide-white/[0.04]">
            ${topProducts.map((p, i) => renderTopProduct(p, i, topProducts[0]?.revenue ?? 1)).join("")}
          </div>`
      }
    </div>`;

  const body = `
    ${statRow}
    ${chartCard}
    <div class="grid lg:grid-cols-5 gap-4 md:gap-6">
      <div class="lg:col-span-3">${topProductsCard}</div>
      <div class="lg:col-span-2 space-y-4 md:space-y-6">
        <div class="card-glass rounded-2xl overflow-hidden">
          <div class="px-5 md:px-6 py-4 border-b border-white/[0.06] flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-lg bg-cyan-500/10 grid place-items-center">
              <span class="text-cyan-400">${icon("clock", "w-4 h-4")}</span>
            </span>
            <h3 class="font-semibold text-white text-sm">Status Order</h3>
          </div>
          <div class="p-5 md:p-6">${renderStatusBreakdown(byStatus)}</div>
        </div>
        <div class="card-glass rounded-2xl overflow-hidden">
          <div class="px-5 md:px-6 py-4 border-b border-white/[0.06] flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-lg bg-amber-500/10 grid place-items-center">
              <span class="text-amber-400">${icon("bot", "w-4 h-4")}</span>
            </span>
            <h3 class="font-semibold text-white text-sm">Per Platform</h3>
          </div>
          <div class="p-5 md:p-6">${renderPlatformBreakdown(byPlatform)}</div>
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


function statCard(label: string, value: string, iconName: string, gradient: string, textColor: string, delay: string): string {
  return `
    <div class="group relative card-glass rounded-2xl p-5 overflow-hidden hover:border-slate-600/50 transition-all duration-300 animate-in" style="animation-delay: ${delay}">
      <div class="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-[0.07] blur-2xl bg-gradient-to-br ${gradient} group-hover:opacity-[0.12] transition-opacity"></div>
      <div class="flex items-start justify-between mb-3 relative">
        <span class="text-[11px] uppercase tracking-wider text-slate-500 font-medium">${label}</span>
        <span class="${textColor} opacity-80">${icon(iconName, "w-4 h-4")}</span>
      </div>
      <div class="text-2xl font-bold ${textColor} relative tabular-nums tracking-tight">${value}</div>
    </div>`;
}

function renderRevenueChart(days: Array<{ date: string; revenue: number; orders: number }>): string {
  if (days.every((d) => d.revenue === 0)) {
    return `<div class="py-12">${renderEmptyState("Belum ada data", "Chart akan muncul setelah ada order PAID dalam 30 hari terakhir.", "trending_up")}</div>`;
  }

  const W = 800;
  const H = 260;
  const padX = 45;
  const padTop = 20;
  const padBot = 35;
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

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((p) => ({
    y: padTop + innerH - p * innerH,
    label: formatCompact(max * p),
  }));

  const xTicks = points.filter((_, i) => i % 5 === 0 || i === points.length - 1);


  const dots = points
    .map(
      (p) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4"
      class="fill-emerald-400 opacity-0 hover:opacity-100 transition cursor-pointer" stroke="#0a0e1a" stroke-width="2">
      <title>${escapeHtml(p.date)}: ${formatIDR(p.revenue)} (${p.orders} order)</title>
    </circle>`,
    )
    .join("");

  return `
    <svg viewBox="0 0 ${W} ${H}" class="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#34d399" stop-opacity="0.2"/>
          <stop offset="100%" stop-color="#34d399" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#34d399"/>
          <stop offset="100%" stop-color="#22d3ee"/>
        </linearGradient>
      </defs>
      ${yTicks
        .map(
          (t) => `
          <line x1="${padX}" y1="${t.y}" x2="${W - padX}" y2="${t.y}" stroke="rgba(255,255,255,0.04)" stroke-dasharray="3,6"/>
          <text x="${padX - 10}" y="${t.y + 4}" text-anchor="end" font-size="10" fill="#64748b" font-family="JetBrains Mono, monospace">${escapeHtml(t.label)}</text>`,
        )
        .join("")}
      <path d="${areaPath}" fill="url(#areaGrad)"/>
      <path d="${linePath}" fill="none" stroke="url(#lineGrad)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      ${dots}
      ${xTicks
        .map(
          (p) => `<text x="${p.x}" y="${H - 10}" text-anchor="middle" font-size="10" fill="#64748b" font-family="JetBrains Mono, monospace">${escapeHtml(p.date.slice(5))}</text>`,
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
      ? "text-amber-300 bg-amber-500/10 ring-1 ring-amber-500/20"
      : rank === 2
        ? "text-slate-200 bg-slate-500/10 ring-1 ring-slate-500/20"
        : rank === 3
          ? "text-orange-300 bg-orange-500/10 ring-1 ring-orange-500/20"
          : "text-slate-400 bg-slate-700/30 ring-1 ring-slate-600/30";
  return `
    <div class="px-5 md:px-6 py-4 hover:bg-white/[0.02] transition-colors">
      <div class="flex items-center gap-3 mb-2.5">
        <span class="w-8 h-8 rounded-lg ${rankColor} grid place-items-center text-xs font-bold tabular-nums shrink-0">${rank}</span>
        <div class="flex-1 min-w-0">
          <div class="font-medium text-white truncate">${escapeHtml(p.name)}</div>
          <div class="text-xs text-slate-500 font-mono">${escapeHtml(p.productId)}</div>
        </div>
        <div class="text-right whitespace-nowrap">
          <div class="font-semibold text-emerald-300 tabular-nums">${escapeHtml(formatIDR(p.revenue))}</div>
          <div class="text-xs text-slate-500">${p.sold} terjual</div>
        </div>
      </div>
      <div class="h-1.5 bg-slate-800/40 rounded-full overflow-hidden ml-11">
        <div class="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all" style="width: ${pct.toFixed(0)}%"></div>
      </div>
    </div>`;
}

function renderStatusBreakdown(items: Array<{ status: string; count: number }>): string {
  if (items.length === 0) return `<div class="text-sm text-slate-500 text-center py-6">Belum ada data</div>`;
  const total = items.reduce((a, b) => a + b.count, 0);
  const colors: Record<string, { bar: string; text: string }> = {
    PENDING: { bar: "bg-amber-500", text: "text-amber-300" },
    PAID: { bar: "bg-emerald-500", text: "text-emerald-300" },
    EXPIRED: { bar: "bg-red-500", text: "text-red-300" },
    FAILED: { bar: "bg-red-500", text: "text-red-300" },
  };
  return `<div class="space-y-4">
    ${items
      .map((it) => {
        const c = colors[it.status] ?? { bar: "bg-slate-500", text: "text-slate-300" };
        const pct = total > 0 ? (it.count / total) * 100 : 0;
        return `<div>
          <div class="flex items-center justify-between text-xs mb-2">
            <span class="${c.text} font-medium">${escapeHtml(it.status)}</span>
            <span class="text-slate-500 tabular-nums">${it.count} <span class="text-slate-700">(${pct.toFixed(0)}%)</span></span>
          </div>
          <div class="h-2 bg-slate-800/40 rounded-full overflow-hidden">
            <div class="h-full ${c.bar} rounded-full transition-all" style="width: ${pct.toFixed(0)}%"></div>
          </div>
        </div>`;
      })
      .join("")}
  </div>`;
}


function renderPlatformBreakdown(items: Array<{ platform: string; count: number; revenue: number }>): string {
  if (items.length === 0) return `<div class="text-sm text-slate-500 text-center py-6">Belum ada penjualan</div>`;
  const totalRev = items.reduce((a, b) => a + b.revenue, 0) || 1;
  return `<div class="space-y-5">
    ${items
      .map((it) => {
        const isTg = it.platform === "TELEGRAM";
        const accent = isTg ? "from-cyan-500 to-cyan-600" : "from-violet-500 to-violet-600";
        const textColor = isTg ? "text-cyan-300" : "text-violet-300";
        const bgColor = isTg ? "bg-cyan-500/10 ring-1 ring-cyan-500/20" : "bg-violet-500/10 ring-1 ring-violet-500/20";
        const pct = (it.revenue / totalRev) * 100;
        return `<div>
          <div class="flex items-center justify-between mb-2">
            <span class="inline-flex items-center gap-2.5 ${textColor} text-sm font-medium">
              <span class="w-7 h-7 rounded-lg ${bgColor} grid place-items-center text-[10px] font-bold">${isTg ? "TG" : "DC"}</span>
              ${escapeHtml(it.platform)}
            </span>
            <span class="font-semibold tabular-nums ${textColor}">${escapeHtml(formatIDR(it.revenue))}</span>
          </div>
          <div class="h-2 bg-slate-800/40 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r ${accent} rounded-full transition-all" style="width: ${pct.toFixed(0)}%"></div>
          </div>
          <div class="text-xs text-slate-500 mt-1.5 tabular-nums">${it.count} order</div>
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
