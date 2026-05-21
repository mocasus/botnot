import { escapeHtml, layout } from "../layout.js";
import { formatIDR } from "../../service.js";

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

  const rows = products
    .map(
      (p) => `
    <tr class="border-t border-slate-800/50 hover:bg-slate-800/30">
      <td class="px-5 py-3 font-mono text-xs">${escapeHtml(p.id)}</td>
      <td class="px-5 py-3">
        <div class="font-medium">${escapeHtml(p.name)}</div>
        ${p.description ? `<div class="text-xs text-slate-500">${escapeHtml(p.description)}</div>` : ""}
      </td>
      <td class="px-5 py-3">${escapeHtml(formatIDR(p.priceIDR))}</td>
      <td class="px-5 py-3 text-slate-400">${escapeHtml(p.type)}</td>
      <td class="px-5 py-3">
        <span class="text-emerald-300">${p.available}</span>
        <span class="text-slate-600">/ ${p.available + p.sold}</span>
      </td>
      <td class="px-5 py-3">
        ${
          p.active
            ? `<span class="px-2 py-1 rounded text-xs border bg-emerald-500/10 text-emerald-300 border-emerald-500/30">Active</span>`
            : `<span class="px-2 py-1 rounded text-xs border bg-slate-700 text-slate-300">Inactive</span>`
        }
      </td>
      <td class="px-5 py-3 space-x-2 whitespace-nowrap text-right">
        <a href="/admin/products/${encodeURIComponent(p.id)}/stock"
          class="text-cyan-400 hover:underline text-sm">Kelola Stok</a>
        <form method="POST" action="/admin/products/${encodeURIComponent(p.id)}/toggle" class="inline">
          <button class="text-amber-400 hover:underline text-sm">${p.active ? "Disable" : "Enable"}</button>
        </form>
      </td>
    </tr>`,
    )
    .join("");

  const body = `
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Produk</h1>
    </div>

    <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
      <h2 class="font-semibold mb-4">Tambah Produk Baru</h2>
      <form method="POST" action="/admin/products" class="grid md:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs uppercase tracking-wide text-slate-500 mb-1">ID Produk</label>
          <input name="id" required pattern="[A-Za-z0-9_-]+" placeholder="NETFLIX-1B"
            class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 focus:border-cyan-500 focus:outline-none font-mono text-sm" />
        </div>
        <div>
          <label class="block text-xs uppercase tracking-wide text-slate-500 mb-1">Nama</label>
          <input name="name" required placeholder="Netflix Premium 1 Bulan"
            class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 focus:border-cyan-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-xs uppercase tracking-wide text-slate-500 mb-1">Harga (IDR)</label>
          <input name="priceIDR" type="number" min="1" required placeholder="25000"
            class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 focus:border-cyan-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-xs uppercase tracking-wide text-slate-500 mb-1">Tipe</label>
          <select name="type" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 focus:border-cyan-500 focus:outline-none">
            <option>ACCOUNT</option>
            <option>LICENSE</option>
            <option>VOUCHER</option>
            <option>FILE</option>
            <option>OTHER</option>
          </select>
        </div>
        <div class="md:col-span-2">
          <label class="block text-xs uppercase tracking-wide text-slate-500 mb-1">Deskripsi (opsional)</label>
          <input name="description" placeholder="Akun sharing 1 profil. Garansi 30 hari."
            class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 focus:border-cyan-500 focus:outline-none" />
        </div>
        <div class="md:col-span-2">
          <button class="bg-gradient-to-r from-cyan-500 to-violet-500 hover:opacity-90 transition rounded-lg px-5 py-2 font-medium">Tambah Produk</button>
        </div>
      </form>
    </div>

    <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div class="px-5 py-3 border-b border-slate-800">
        <h2 class="font-semibold">Daftar Produk (${products.length})</h2>
      </div>
      ${
        products.length === 0
          ? `<div class="px-5 py-8 text-center text-slate-500 text-sm">Belum ada produk.</div>`
          : `<table class="w-full text-sm">
              <thead class="bg-slate-950/50 text-xs uppercase tracking-wide text-slate-500">
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
            </table>`
      }
    </div>
  `;

  return layout({ title: "Produk", body, active: "products", flash });
}
