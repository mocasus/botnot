import { escapeHtml, layout } from "../layout.js";
import { formatIDR } from "../../service.js";

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

  const rows = stocks
    .map(
      (s) => `
    <tr class="border-t border-slate-800/50 hover:bg-slate-800/30">
      <td class="px-5 py-3 text-xs text-slate-500">#${s.id}</td>
      <td class="px-5 py-3 font-mono text-xs whitespace-pre-wrap break-all">${escapeHtml(s.payload)}</td>
      <td class="px-5 py-3">
        ${
          s.used
            ? `<span class="px-2 py-1 rounded text-xs border bg-slate-700 text-slate-400">Used</span>`
            : `<span class="px-2 py-1 rounded text-xs border bg-emerald-500/10 text-emerald-300 border-emerald-500/30">Available</span>`
        }
      </td>
      <td class="px-5 py-3 font-mono text-xs text-slate-500">${escapeHtml(s.orderId ?? "")}</td>
      <td class="px-5 py-3 text-xs text-slate-500">${escapeHtml(s.createdAt.toISOString().slice(0, 19).replace("T", " "))}</td>
    </tr>`,
    )
    .join("");

  const body = `
    <div class="mb-6">
      <a href="/admin/products" class="text-cyan-400 hover:underline text-sm">← Kembali ke produk</a>
      <h1 class="text-2xl font-bold mt-2">Stok: ${escapeHtml(product.name)}</h1>
      <p class="text-slate-400 text-sm">
        <span class="font-mono">${escapeHtml(product.id)}</span> ·
        ${escapeHtml(formatIDR(product.priceIDR))} ·
        <span class="text-emerald-300">${available} available</span>,
        <span class="text-slate-500">${sold} sold</span>
      </p>
    </div>

    <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
      <h2 class="font-semibold mb-2">Tambah Stok (Bulk)</h2>
      <p class="text-sm text-slate-400 mb-3">Satu item per baris. Cocok untuk paste daftar akun/license/voucher sekaligus.</p>
      <form method="POST" action="/admin/products/${encodeURIComponent(product.id)}/stock">
        <textarea name="payloads" required rows="8"
          placeholder="email1@example.com|password1&#10;email2@example.com|password2&#10;XXXXX-YYYYY-ZZZZZ"
          class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 mb-3 font-mono text-sm focus:border-cyan-500 focus:outline-none"></textarea>
        <button class="bg-gradient-to-r from-cyan-500 to-violet-500 hover:opacity-90 transition rounded-lg px-5 py-2 font-medium">Tambah Stok</button>
      </form>
    </div>

    <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div class="px-5 py-3 border-b border-slate-800">
        <h2 class="font-semibold">Daftar Stok (${stocks.length} terakhir)</h2>
      </div>
      ${
        stocks.length === 0
          ? `<div class="px-5 py-8 text-center text-slate-500 text-sm">Belum ada stok.</div>`
          : `<table class="w-full text-sm">
              <thead class="bg-slate-950/50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th class="text-left px-5 py-3 font-medium">#</th>
                  <th class="text-left px-5 py-3 font-medium">Payload</th>
                  <th class="text-left px-5 py-3 font-medium">Status</th>
                  <th class="text-left px-5 py-3 font-medium">Order</th>
                  <th class="text-left px-5 py-3 font-medium">Dibuat</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>`
      }
    </div>
  `;

  return layout({ title: `Stok ${product.id}`, body, active: "products", flash });
}
