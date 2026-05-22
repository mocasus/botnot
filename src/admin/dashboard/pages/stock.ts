import { escapeHtml, icon, layout } from "../layout.js";
import { formatIDR } from "../../service.js";
import { renderEmptyState } from "./home.js";

interface StockItem {
  id: number;
  payload: string;
  used: boolean;
  usedAt: Date | null;
  orderId: string | null;
  createdAt: Date;
}

interface ProductInfo {
  id: string;
  name: string;
  priceIDR: number;
}

export function renderStock(opts: {
  product: ProductInfo;
  stocks: StockItem[];
  available: number;
  sold: number;
  flash?: { kind: "success" | "error" | "info"; message: string } | null;
}): string {
  const { product, stocks, available, sold, flash } = opts;
  const total = available + sold;
  const pct = total > 0 ? Math.round((available / total) * 100) : 0;


  const rows = stocks
    .map(
      (s) => `
    <tr class="hover:bg-white/[0.02] transition-colors">
      <td class="px-5 md:px-6 py-3.5 text-xs text-slate-500 font-mono tabular-nums">#${s.id}</td>
      <td class="px-5 md:px-6 py-3.5">
        <code class="font-mono text-xs text-slate-300 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-white/[0.06] whitespace-pre-wrap break-all inline-block max-w-[300px]">${escapeHtml(s.payload)}</code>
      </td>
      <td class="px-5 md:px-6 py-3.5">
        ${
          s.used
            ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border font-medium bg-slate-700/30 text-slate-400 border-slate-600/50">
                <span class="w-1.5 h-1.5 rounded-full bg-slate-500"></span>Used
              </span>`
            : `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border font-medium bg-emerald-500/10 text-emerald-200 border-emerald-500/20">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/40"></span>Available
              </span>`
        }
      </td>
      <td class="px-5 md:px-6 py-3.5 font-mono text-xs text-slate-500">${escapeHtml(s.orderId ?? "—")}</td>
      <td class="px-5 md:px-6 py-3.5 text-xs text-slate-500 whitespace-nowrap tabular-nums">${escapeHtml(s.createdAt.toISOString().slice(0, 19).replace("T", " "))}</td>
    </tr>`,
    )
    .join("");


  const summaryCard = `
    <div class="card-glass rounded-2xl p-5 md:p-6 mb-6">
      <div class="flex items-start justify-between gap-6 flex-wrap">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3 mb-2">
            <span class="text-xs font-mono text-slate-400 bg-slate-800/40 px-2.5 py-1 rounded-lg border border-white/[0.06]">${escapeHtml(product.id)}</span>
            <span class="text-xs text-slate-600">·</span>
            <span class="text-sm text-slate-300 font-medium tabular-nums">${escapeHtml(formatIDR(product.priceIDR))}</span>
          </div>
          <h2 class="text-xl font-bold text-white">${escapeHtml(product.name)}</h2>
        </div>
        <div class="grid grid-cols-3 gap-5 text-center">
          <div>
            <div class="text-2xl font-bold text-emerald-400 tabular-nums">${available}</div>
            <div class="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5 font-medium">Available</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-slate-400 tabular-nums">${sold}</div>
            <div class="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5 font-medium">Sold</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-white tabular-nums">${total}</div>
            <div class="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5 font-medium">Total</div>
          </div>
        </div>
      </div>
      ${
        total > 0
          ? `<div class="mt-5">
              <div class="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                <span>Stok tersedia</span>
                <span class="font-semibold tabular-nums ${pct === 0 ? "text-red-400" : pct < 25 ? "text-amber-400" : "text-emerald-400"}">${pct}%</span>
              </div>
              <div class="h-2.5 bg-slate-800/40 rounded-full overflow-hidden">
                <div class="h-full transition-all rounded-full ${pct === 0 ? "bg-red-500" : pct < 25 ? "bg-amber-500" : "bg-gradient-to-r from-emerald-500 to-cyan-500"}" style="width: ${pct}%"></div>
              </div>
            </div>`
          : ""
      }
    </div>`;


  const body = `
    ${summaryCard}

    <div class="grid lg:grid-cols-5 gap-4 md:gap-6">
      <!-- Add Stock Form -->
      <div class="lg:col-span-2 card-glass rounded-2xl overflow-hidden self-start">
        <div class="px-5 md:px-6 py-4 border-b border-white/[0.06] flex items-center gap-2.5">
          <span class="w-8 h-8 rounded-lg bg-cyan-500/10 grid place-items-center">
            <span class="text-cyan-400">${icon("plus", "w-4 h-4")}</span>
          </span>
          <div>
            <h2 class="font-semibold text-white text-sm">Tambah Stok</h2>
            <p class="text-xs text-slate-500">Satu item per baris</p>
          </div>
        </div>
        <form method="POST" action="/admin/products/${encodeURIComponent(product.id)}/stock" class="p-5 md:p-6">
          <p class="text-sm text-slate-400 mb-3 leading-relaxed">Cocok untuk paste daftar akun/license/voucher sekaligus.</p>
          <textarea name="payloads" required rows="10"
            placeholder="email1@example.com|password1&#10;email2@example.com|password2&#10;XXXXX-YYYYY-ZZZZZ"
            class="w-full bg-slate-950/60 border border-slate-700/50 rounded-xl px-4 py-3 mb-4 font-mono text-sm focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 focus:outline-none transition-all resize-y placeholder:text-slate-600"></textarea>
          <button class="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 active:scale-[0.98] transition-all rounded-xl px-5 py-2.5 font-semibold shadow-lg shadow-cyan-500/20 w-full justify-center text-white">
            ${icon("plus", "w-4 h-4")} Tambah Stok
          </button>
        </form>
      </div>

      <!-- Stock List -->
      <div class="lg:col-span-3 card-glass rounded-2xl overflow-hidden">
        <div class="px-5 md:px-6 py-4 border-b border-white/[0.06] flex items-center gap-2.5">
          <span class="w-8 h-8 rounded-lg bg-violet-500/10 grid place-items-center">
            <span class="text-violet-400">${icon("archive", "w-4 h-4")}</span>
          </span>
          <div>
            <h2 class="font-semibold text-white text-sm">Daftar Stok</h2>
          </div>
          <span class="text-xs text-slate-500 bg-slate-800/40 px-2.5 py-1 rounded-full border border-white/[0.06] ml-1">${stocks.length} terakhir</span>
        </div>
        ${
          stocks.length === 0
            ? renderEmptyState("Belum ada stok", "Tambahkan stok pertama lewat form di sebelah.", "archive")
            : `<div class="overflow-x-auto"><table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-white/[0.04]">
                    <th class="text-left px-5 md:px-6 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-medium">#</th>
                    <th class="text-left px-5 md:px-6 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-medium">Payload</th>
                    <th class="text-left px-5 md:px-6 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-medium">Status</th>
                    <th class="text-left px-5 md:px-6 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-medium">Order</th>
                    <th class="text-left px-5 md:px-6 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-medium">Dibuat</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/[0.04]">${rows}</tbody>
              </table></div>`
        }
      </div>
    </div>
  `;

  return layout({
    title: `Stok ${product.id}`,
    body,
    active: "products",
    flash,
    pageTitle: "Kelola Stok",
    breadcrumb: [
      { label: "Produk", href: "/admin/products" },
      { label: product.name },
    ],
  });
}
