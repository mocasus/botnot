import { escapeHtml, icon, layout } from "../layout.js";
import { formatIDR } from "../../service.js";
import { renderEmptyState } from "./home.js";

interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  priceIDR: number;
  type: string;
  active: boolean;
  available: number;
  sold: number;
}

export function renderProducts(opts: {
  products: ProductRow[];
  flash?: { kind: "success" | "error" | "info"; message: string } | null;
}): string {
  const { products, flash } = opts;

  const stockBar = (available: number, sold: number) => {
    const total = available + sold;
    if (total === 0) {
      return `<div class="text-xs text-slate-600">No stock</div>`;
    }
    const pct = Math.round((available / total) * 100);
    const barColor =
      pct === 0 ? "bg-red-500" : pct < 25 ? "bg-amber-500" : "bg-emerald-500";
    return `
      <div class="flex items-center gap-2">
        <div class="flex-1 max-w-[100px] h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div class="h-full ${barColor} transition-all" style="width: ${pct}%"></div>
        </div>
        <div class="text-xs whitespace-nowrap">
          <span class="text-emerald-300 font-medium">${available}</span>
          <span class="text-slate-600">/${total}</span>
        </div>
      </div>`;
  };

  const rows = products
    .map(
      (p) => `
    <tr class="border-t border-slate-800/50 hover:bg-slate-800/40 transition">
      <td class="px-5 py-4 font-mono text-xs text-slate-400">${escapeHtml(p.id)}</td>
      <td class="px-5 py-4">
        <div class="font-medium text-slate-100">${escapeHtml(p.name)}</div>
        ${p.description ? `<div class="text-xs text-slate-500 mt-0.5 line-clamp-1">${escapeHtml(p.description)}</div>` : ""}
      </td>
      <td class="px-5 py-4 font-medium">${escapeHtml(formatIDR(p.priceIDR))}</td>
      <td class="px-5 py-4">
        <span class="text-xs font-mono text-slate-400 bg-slate-800/60 px-2 py-1 rounded">${escapeHtml(p.type)}</span>
      </td>
      <td class="px-5 py-4">${stockBar(p.available, p.sold)}</td>
      <td class="px-5 py-4">
        ${
          p.active
            ? `<span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border font-medium bg-emerald-500/10 text-emerald-200 border-emerald-500/30">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>Aktif
              </span>`
            : `<span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border font-medium bg-slate-700/40 text-slate-400 border-slate-600">
                <span class="w-1.5 h-1.5 rounded-full bg-slate-500"></span>Nonaktif
              </span>`
        }
      </td>
      <td class="px-5 py-4 whitespace-nowrap text-right">
        <div class="inline-flex items-center gap-1">
          <a href="/admin/products/${encodeURIComponent(p.id)}/stock"
            class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-cyan-300 hover:text-cyan-200 hover:bg-cyan-500/10 transition">
            ${icon("archive", "w-3.5 h-3.5")} Kelola Stok
          </a>
          <form method="POST" action="/admin/products/${encodeURIComponent(p.id)}/toggle" class="inline">
            <button class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium ${p.active ? "text-amber-300 hover:text-amber-200 hover:bg-amber-500/10" : "text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/10"} transition">
              ${icon(p.active ? "x" : "check", "w-3.5 h-3.5")}
              ${p.active ? "Disable" : "Enable"}
            </button>
          </form>
        </div>
      </td>
    </tr>`,
    )
    .join("");

  const inputCls =
    "w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition";
  const labelCls = "block text-xs uppercase tracking-wider text-slate-500 mb-1.5 font-medium";

  const body = `
    <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6">
      <div class="px-6 py-4 border-b border-slate-800 flex items-center gap-2.5">
        <span class="text-cyan-400">${icon("plus", "w-4 h-4")}</span>
        <h2 class="font-semibold">Tambah Produk Baru</h2>
      </div>
      <form method="POST" action="/admin/products" class="p-6 grid md:grid-cols-2 gap-4">
        <div>
          <label class="${labelCls}">ID Produk</label>
          <input name="id" required pattern="[A-Za-z0-9_-]+" placeholder="NETFLIX-1B"
            class="${inputCls} font-mono text-sm" />
          <p class="text-[11px] text-slate-600 mt-1">Hanya huruf, angka, _, dan -</p>
        </div>
        <div>
          <label class="${labelCls}">Nama</label>
          <input name="name" required placeholder="Netflix Premium 1 Bulan"
            class="${inputCls}" />
        </div>
        <div>
          <label class="${labelCls}">Harga (IDR)</label>
          <input name="priceIDR" type="number" min="1" required placeholder="25000"
            class="${inputCls}" />
        </div>
        <div>
          <label class="${labelCls}">Tipe</label>
          <select name="type" class="${inputCls}">
            <option value="ACCOUNT">ACCOUNT</option>
            <option value="LICENSE">LICENSE</option>
            <option value="VOUCHER">VOUCHER</option>
            <option value="FILE">FILE</option>
            <option value="OTHER">OTHER</option>
          </select>
        </div>
        <div class="md:col-span-2">
          <label class="${labelCls}">Deskripsi <span class="text-slate-600 normal-case">(opsional)</span></label>
          <input name="description" placeholder="Akun sharing 1 profil. Garansi 30 hari."
            class="${inputCls}" />
        </div>
        <div class="md:col-span-2 pt-2">
          <button class="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-violet-500 hover:opacity-90 active:scale-[0.99] transition rounded-lg px-5 py-2.5 font-medium shadow-lg shadow-cyan-500/20">
            ${icon("plus", "w-4 h-4")} Tambah Produk
          </button>
        </div>
      </form>
    </div>

    <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-800 flex items-center gap-2.5">
        <span class="text-violet-400">${icon("package", "w-4 h-4")}</span>
        <h2 class="font-semibold">Daftar Produk</h2>
        <span class="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">${products.length}</span>
      </div>
      ${
        products.length === 0
          ? renderEmptyState("Belum ada produk", "Tambah produk pertama lewat form di atas.", "package")
          : `<div class="overflow-x-auto"><table class="w-full text-sm">
              <thead class="bg-slate-950/50 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th class="text-left px-5 py-3 font-medium">ID</th>
                  <th class="text-left px-5 py-3 font-medium">Nama</th>
                  <th class="text-left px-5 py-3 font-medium">Harga</th>
                  <th class="text-left px-5 py-3 font-medium">Tipe</th>
                  <th class="text-left px-5 py-3 font-medium">Stok</th>
                  <th class="text-left px-5 py-3 font-medium">Status</th>
                  <th class="text-right px-5 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table></div>`
      }
    </div>
  `;

  return layout({
    title: "Produk",
    body,
    active: "products",
    flash,
    pageTitle: "Produk",
    pageSubtitle: "Kelola katalog produk yang dijual oleh bot",
  });
}
