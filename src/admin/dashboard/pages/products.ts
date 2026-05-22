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
      return `<div class="text-xs text-slate-600 italic">No stock</div>`;
    }
    const pct = Math.round((available / total) * 100);
    const barColor =
      pct === 0 ? "bg-red-500" : pct < 25 ? "bg-amber-500" : "bg-gradient-to-r from-emerald-500 to-cyan-500";
    return `
      <div class="flex items-center gap-2.5">
        <div class="flex-1 max-w-[80px] h-1.5 bg-slate-800/60 rounded-full overflow-hidden">
          <div class="h-full ${barColor} rounded-full transition-all" style="width: ${pct}%"></div>
        </div>
        <div class="text-xs whitespace-nowrap tabular-nums">
          <span class="text-emerald-300 font-semibold">${available}</span>
          <span class="text-slate-600">/</span>
          <span class="text-slate-500">${total}</span>
        </div>
      </div>`;
  };

  const rows = products
    .map(
      (p) => `
    <tr class="hover:bg-white/[0.02] transition-colors">
      <td class="px-5 md:px-6 py-4 font-mono text-xs text-slate-400">${escapeHtml(p.id)}</td>
      <td class="px-5 md:px-6 py-4">
        <div class="font-medium text-white">${escapeHtml(p.name)}</div>
        ${p.description ? `<div class="text-xs text-slate-500 mt-0.5 line-clamp-1">${escapeHtml(p.description)}</div>` : ""}
      </td>
      <td class="px-5 md:px-6 py-4 font-semibold text-white tabular-nums">${escapeHtml(formatIDR(p.priceIDR))}</td>
      <td class="px-5 md:px-6 py-4">
        <span class="text-xs font-mono text-slate-400 bg-slate-800/40 px-2 py-1 rounded-md border border-white/[0.06]">${escapeHtml(p.type)}</span>
      </td>
      <td class="px-5 md:px-6 py-4">${stockBar(p.available, p.sold)}</td>
      <td class="px-5 md:px-6 py-4">
        ${
          p.active
            ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border font-medium bg-emerald-500/10 text-emerald-200 border-emerald-500/20">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/40"></span>Aktif
              </span>`
            : `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border font-medium bg-slate-700/30 text-slate-400 border-slate-600/50">
                <span class="w-1.5 h-1.5 rounded-full bg-slate-500"></span>Nonaktif
              </span>`
        }
      </td>
      <td class="px-5 md:px-6 py-4 whitespace-nowrap text-right">
        <div class="inline-flex items-center gap-1">
          <a href="/admin/products/${encodeURIComponent(p.id)}/stock"
            class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-cyan-300 hover:text-cyan-200 hover:bg-cyan-500/10 transition-colors">
            ${icon("archive", "w-3.5 h-3.5")} Stok
          </a>
          <form method="POST" action="/admin/products/${encodeURIComponent(p.id)}/toggle" class="inline">
            <button class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${p.active ? "text-amber-300 hover:text-amber-200 hover:bg-amber-500/10" : "text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/10"} transition-colors">
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
    "w-full bg-slate-950/60 border border-slate-700/50 rounded-xl px-4 py-2.5 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 focus:outline-none transition-all placeholder:text-slate-600";
  const labelCls = "block text-xs uppercase tracking-wider text-slate-500 mb-1.5 font-medium";

  const body = `
    <!-- Add Product Form -->
    <div class="card-glass rounded-2xl overflow-hidden mb-6">
      <div class="px-5 md:px-6 py-4 border-b border-white/[0.06] flex items-center gap-2.5">
        <span class="w-8 h-8 rounded-lg bg-cyan-500/10 grid place-items-center">
          <span class="text-cyan-400">${icon("plus", "w-4 h-4")}</span>
        </span>
        <div>
          <h2 class="font-semibold text-white text-sm">Tambah Produk Baru</h2>
          <p class="text-xs text-slate-500">Isi form untuk menambahkan produk ke katalog</p>
        </div>
      </div>
      <form method="POST" action="/admin/products" class="p-5 md:p-6 grid md:grid-cols-2 gap-4">
        <div>
          <label class="${labelCls}">ID Produk</label>
          <input name="id" required pattern="[A-Za-z0-9_-]+" placeholder="NETFLIX-1B"
            class="${inputCls} font-mono text-sm" />
          <p class="text-[11px] text-slate-600 mt-1.5">Hanya huruf, angka, _, dan -</p>
        </div>
        <div>
          <label class="${labelCls}">Nama</label>
          <input name="name" required placeholder="Netflix Premium 1 Bulan"
            class="${inputCls}" />
        </div>
        <div>
          <label class="${labelCls}">Harga (IDR)</label>
          <input name="priceIDR" type="number" min="1" required placeholder="25000"
            class="${inputCls} tabular-nums" />
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
          <label class="${labelCls}">Deskripsi <span class="text-slate-600 normal-case font-normal">(opsional)</span></label>
          <input name="description" placeholder="Akun sharing 1 profil. Garansi 30 hari."
            class="${inputCls}" />
        </div>
        <div class="md:col-span-2 pt-2">
          <button class="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 active:scale-[0.98] transition-all rounded-xl px-5 py-2.5 font-semibold shadow-lg shadow-cyan-500/20 text-white">
            ${icon("plus", "w-4 h-4")} Tambah Produk
          </button>
        </div>
      </form>
    </div>


    <!-- Product List -->
    <div class="card-glass rounded-2xl overflow-hidden">
      <div class="px-5 md:px-6 py-4 border-b border-white/[0.06] flex items-center gap-2.5">
        <span class="w-8 h-8 rounded-lg bg-violet-500/10 grid place-items-center">
          <span class="text-violet-400">${icon("package", "w-4 h-4")}</span>
        </span>
        <div>
          <h2 class="font-semibold text-white text-sm">Daftar Produk</h2>
        </div>
        <span class="text-xs text-slate-500 bg-slate-800/40 px-2.5 py-1 rounded-full border border-white/[0.06] ml-1">${products.length}</span>
      </div>
      ${
        products.length === 0
          ? renderEmptyState("Belum ada produk", "Tambah produk pertama lewat form di atas.", "package")
          : `<div class="overflow-x-auto"><table class="w-full text-sm">
              <thead>
                <tr class="border-b border-white/[0.04]">
                  <th class="text-left px-5 md:px-6 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-medium">ID</th>
                  <th class="text-left px-5 md:px-6 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-medium">Nama</th>
                  <th class="text-left px-5 md:px-6 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-medium">Harga</th>
                  <th class="text-left px-5 md:px-6 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-medium">Tipe</th>
                  <th class="text-left px-5 md:px-6 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-medium">Stok</th>
                  <th class="text-left px-5 md:px-6 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-medium">Status</th>
                  <th class="text-right px-5 md:px-6 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/[0.04]">${rows}</tbody>
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
