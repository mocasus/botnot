import { escapeHtml, layout } from "../layout.js";
import { formatIDR } from "../../service.js";
import { renderStatusBadge } from "./home.js";

interface OrderRow {
  id: string;
  status: string;
  totalAmount: number | null;
  amount: number;
  qty: number;
  platform: string;
  username: string | null;
  chatId: string;
  delivered: boolean;
  deliveryAttempts: number;
  lastDeliveryError: string | null;
  paidAt: Date | null;
  createdAt: Date;
  product: { name: string; id: string };
}

export function renderOrders(opts: {
  orders: OrderRow[];
  filterStatus?: string;
  flash?: { kind: "success" | "error" | "info"; message: string } | null;
}): string {
  const { orders, filterStatus, flash } = opts;

  const filterButton = (status: string | undefined, label: string) => {
    const active = (filterStatus ?? "") === (status ?? "");
    const href = status ? `?status=${status}` : "/admin/orders";
    return `<a href="${href}" class="px-3 py-1.5 rounded-lg text-sm ${
      active
        ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30"
        : "text-slate-400 hover:text-slate-100 border border-transparent hover:border-slate-700"
    }">${label}</a>`;
  };

  const rows = orders
    .map((o) => {
      const deliveryCell = o.delivered
        ? `<span class="text-emerald-400 text-xs">✓ Terkirim</span>`
        : o.status === "PAID"
          ? `<form method="POST" action="/admin/orders/${encodeURIComponent(o.id)}/redeliver" class="inline">
               <button class="text-amber-400 hover:underline text-xs"
                 onclick="return confirm('Kirim ulang produk ke pembeli?')">Redeliver</button>
             </form>${
               o.lastDeliveryError
                 ? `<div class="text-red-400 text-xs mt-1" title="${escapeHtml(o.lastDeliveryError)}">⚠ ${o.deliveryAttempts}× gagal</div>`
                 : ""
             }`
          : `<span class="text-slate-600 text-xs">-</span>`;

      return `
    <tr class="border-t border-slate-800/50 hover:bg-slate-800/30">
      <td class="px-5 py-3 font-mono text-xs">${escapeHtml(o.id)}</td>
      <td class="px-5 py-3">
        <div>${escapeHtml(o.product.name)}</div>
        <div class="text-xs text-slate-500">x${o.qty}</div>
      </td>
      <td class="px-5 py-3">${escapeHtml(formatIDR(o.totalAmount))}</td>
      <td class="px-5 py-3">${renderStatusBadge(o.status)}</td>
      <td class="px-5 py-3">
        <div class="text-slate-300">${escapeHtml(o.platform)}</div>
        <div class="text-xs text-slate-500">${escapeHtml(o.username ?? o.chatId)}</div>
      </td>
      <td class="px-5 py-3">${deliveryCell}</td>
      <td class="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">${escapeHtml(o.createdAt.toISOString().slice(0, 19).replace("T", " "))}</td>
    </tr>`;
    })
    .join("");

  const body = `
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Order</h1>
      <div class="flex gap-1">
        ${filterButton(undefined, "Semua")}
        ${filterButton("PENDING", "Pending")}
        ${filterButton("PAID", "Paid")}
        ${filterButton("EXPIRED", "Expired")}
      </div>
    </div>

    <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      ${
        orders.length === 0
          ? `<div class="px-5 py-8 text-center text-slate-500 text-sm">Tidak ada order ${filterStatus ? `dengan status ${filterStatus}` : ""}.</div>`
          : `<table class="w-full text-sm">
              <thead class="bg-slate-950/50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th class="text-left px-5 py-3 font-medium">Order ID</th>
                  <th class="text-left px-5 py-3 font-medium">Produk</th>
                  <th class="text-left px-5 py-3 font-medium">Total</th>
                  <th class="text-left px-5 py-3 font-medium">Status</th>
                  <th class="text-left px-5 py-3 font-medium">Pembeli</th>
                  <th class="text-left px-5 py-3 font-medium">Delivery</th>
                  <th class="text-left px-5 py-3 font-medium">Waktu</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>`
      }
    </div>
  `;

  return layout({ title: "Order", body, active: "orders", flash });
}
