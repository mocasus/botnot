import { escapeHtml, icon, layout } from "../layout.js";
import { formatIDR } from "../../service.js";
import { renderEmptyState, renderStatusBadge } from "./home.js";

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

  const filterPill = (
    status: string | undefined,
    label: string,
    iconName: string,
    accent: string,
  ) => {
    const active = (filterStatus ?? "") === (status ?? "");
    const href = status ? `?status=${status}` : "/admin/orders";
    return `<a href="${href}" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
      active
        ? `bg-gradient-to-r from-cyan-500/15 to-violet-500/10 text-cyan-200 ring-1 ring-cyan-500/30`
        : "text-slate-400 hover:text-slate-100 ring-1 ring-transparent hover:ring-slate-700 hover:bg-slate-800/40"
    }">
      <span class="${active ? "text-cyan-300" : accent}">${icon(iconName, "w-3.5 h-3.5")}</span>
      ${label}
    </a>`;
  };

  const platformBadge = (platform: string) => {
    if (platform === "TELEGRAM") {
      return `<span class="inline-flex items-center gap-1.5 text-xs">
        <span class="w-5 h-5 rounded grid place-items-center bg-cyan-500/15 text-cyan-300 text-[10px] font-bold">TG</span>
        <span class="text-slate-300">Telegram</span>
      </span>`;
    }
    return `<span class="inline-flex items-center gap-1.5 text-xs">
      <span class="w-5 h-5 rounded grid place-items-center bg-violet-500/15 text-violet-300 text-[10px] font-bold">DC</span>
      <span class="text-slate-300">Discord</span>
    </span>`;
  };

  const rows = orders
    .map((o) => {
      const deliveryCell = o.delivered
        ? `<span class="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
            ${icon("check", "w-3.5 h-3.5")} Terkirim
          </span>`
        : o.status === "PAID"
          ? `<div class="space-y-1">
              <form method="POST" action="/admin/orders/${encodeURIComponent(o.id)}/redeliver" class="inline">
                <button class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 transition"
                  onclick="return confirm('Kirim ulang produk ke pembeli?')">
                  ${icon("refresh", "w-3.5 h-3.5")} Redeliver
                </button>
              </form>
              ${
                o.lastDeliveryError
                  ? `<div class="text-red-400 text-[11px] flex items-center gap-1" title="${escapeHtml(o.lastDeliveryError)}">
                      ${icon("alert", "w-3 h-3")} ${o.deliveryAttempts}× gagal
                    </div>`
                  : ""
              }
            </div>`
          : `<span class="text-slate-600 text-xs">—</span>`;

      return `
    <tr class="border-t border-slate-800/50 hover:bg-slate-800/40 transition">
      <td class="px-5 py-3 font-mono text-xs text-slate-400">${escapeHtml(o.id)}</td>
      <td class="px-5 py-3">
        <div class="text-slate-200">${escapeHtml(o.product.name)}</div>
        <div class="text-xs text-slate-500 mt-0.5">x${o.qty}</div>
      </td>
      <td class="px-5 py-3 font-medium">${escapeHtml(formatIDR(o.totalAmount))}</td>
      <td class="px-5 py-3">${renderStatusBadge(o.status)}</td>
      <td class="px-5 py-3">
        <div>${platformBadge(o.platform)}</div>
        <div class="text-xs text-slate-500 mt-1">${escapeHtml(o.username ?? o.chatId)}</div>
      </td>
      <td class="px-5 py-3">${deliveryCell}</td>
      <td class="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">${escapeHtml(o.createdAt.toISOString().slice(0, 19).replace("T", " "))}</td>
    </tr>`;
    })
    .join("");

  const filterLabel = filterStatus ? ` dengan status ${filterStatus.toLowerCase()}` : "";

  const body = `
    <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-800 flex items-center gap-3 flex-wrap">
        <div class="flex items-center gap-2.5">
          <span class="text-cyan-400">${icon("bag", "w-4 h-4")}</span>
          <h2 class="font-semibold">Daftar Order</h2>
          ${orders.length > 0 ? `<span class="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">${orders.length}</span>` : ""}
        </div>
        <div class="flex gap-1 ml-auto">
          ${filterPill(undefined, "Semua", "package", "text-slate-500")}
          ${filterPill("PENDING", "Pending", "clock", "text-amber-400")}
          ${filterPill("PAID", "Paid", "check", "text-emerald-400")}
          ${filterPill("EXPIRED", "Expired", "x", "text-red-400")}
        </div>
      </div>
      ${
        orders.length === 0
          ? renderEmptyState(
              `Tidak ada order${filterLabel}`,
              "Order baru akan muncul di sini setelah pembeli scan QRIS dan bayar.",
              "bag",
            )
          : `<div class="overflow-x-auto"><table class="w-full text-sm">
              <thead class="bg-slate-950/50 text-[11px] uppercase tracking-wider text-slate-500">
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
            </table></div>`
      }
    </div>
  `;

  return layout({
    title: "Order",
    body,
    active: "orders",
    flash,
    pageTitle: "Order",
    pageSubtitle: "Lihat dan kelola semua order yang masuk",
  });
}
