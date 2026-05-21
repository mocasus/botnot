import type { FastifyInstance } from "fastify";
import { logger } from "../../logger.js";
import {
  addStock,
  createProduct,
  getStats,
  getStockForProduct,
  listProductsWithStock,
  listRecentOrders,
  redeliverOrder,
  toggleProductActive,
} from "../service.js";
import { getAnalytics } from "../analytics.js";
import { prisma } from "../../db.js";
import {
  COOKIE_MAX_AGE_SEC,
  SESSION_COOKIE,
  checkCredentials,
  requireAuth,
} from "./middleware.js";
import { loginLayout } from "./layout.js";
import { renderHome } from "./pages/home.js";
import { renderProducts } from "./pages/products.js";
import { renderStock } from "./pages/stock.js";
import { renderOrders } from "./pages/orders.js";
import { renderAnalytics } from "./pages/analytics.js";

type Flash = { kind: "success" | "error" | "info"; message: string };

const FLASH_COOKIE = "botnot_flash";

function setFlash(reply: import("fastify").FastifyReply, flash: Flash) {
  reply.setCookie(FLASH_COOKIE, JSON.stringify(flash), {
    path: "/admin",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 30,
  });
}

function popFlash(
  req: import("fastify").FastifyRequest,
  reply: import("fastify").FastifyReply,
): Flash | null {
  const raw = req.cookies?.[FLASH_COOKIE];
  if (!raw) return null;
  reply.clearCookie(FLASH_COOKIE, { path: "/admin" });
  try {
    return JSON.parse(raw) as Flash;
  } catch {
    return null;
  }
}

export function registerAdminDashboardRoutes(app: FastifyInstance): void {
  // === Login ===
  app.get("/admin/login", async (req, reply) => {
    return reply.type("text/html").send(loginLayout({}));
  });

  app.post<{ Body: { username?: string; password?: string } }>(
    "/admin/login",
    {
      // Rate limit per IP — 10 percobaan / 5 menit untuk mitigasi brute force.
      // Pakai any-cast karena type-augmentation @fastify/rate-limit di v10 bermasalah dengan v5.
      // Aman karena value sudah divalidasi oleh plugin.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      config: { rateLimit: { max: 10, timeWindow: "5 minutes" } } as any,
    },
    async (req, reply) => {
      const { username = "", password = "" } = req.body ?? {};
      if (!checkCredentials(username, password)) {
        logger.warn({ ip: req.ip, username }, "Failed admin login attempt");
        return reply
          .code(401)
          .type("text/html")
          .send(loginLayout({ error: "Username atau password salah." }));
      }
      reply.setCookie(SESSION_COOKIE, "ok", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        signed: true,
        maxAge: COOKIE_MAX_AGE_SEC,
      });
      return reply.redirect("/admin");
    },
  );

  app.post("/admin/logout", async (req, reply) => {
    reply.clearCookie(SESSION_COOKIE, { path: "/" });
    return reply.redirect("/admin/login");
  });

  // === Dashboard home ===
  app.get("/admin", async (req, reply) => {
    if (!(await requireAuth(req, reply))) return;
    const [stats, recent] = await Promise.all([getStats(), listRecentOrders({ take: 10 })]);
    return reply.type("text/html").send(renderHome({ stats, recent }));
  });

  // === Analytics ===
  app.get("/admin/analytics", async (req, reply) => {
    if (!(await requireAuth(req, reply))) return;
    const data = await getAnalytics();
    return reply.type("text/html").send(renderAnalytics(data));
  });

  // === Products list + create ===
  app.get("/admin/products", async (req, reply) => {
    if (!(await requireAuth(req, reply))) return;
    const products = await listProductsWithStock();
    const flash = popFlash(req, reply);
    return reply.type("text/html").send(renderProducts({ products, flash }));
  });

  app.post<{
    Body: { id?: string; name?: string; priceIDR?: string; description?: string; type?: string };
  }>("/admin/products", async (req, reply) => {
    if (!(await requireAuth(req, reply))) return;
    try {
      const { id, name, priceIDR, description, type } = req.body ?? {};
      if (!id || !name || !priceIDR) throw new Error("Field id, name, priceIDR wajib diisi");
      await createProduct({
        id: id.trim(),
        name: name.trim(),
        priceIDR: parseInt(priceIDR, 10),
        description: description?.trim() || undefined,
        type: type?.trim() || undefined,
      });
      setFlash(reply, { kind: "success", message: `Produk "${id}" berhasil ditambahkan` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setFlash(reply, { kind: "error", message: msg });
    }
    return reply.redirect("/admin/products");
  });

  app.post<{ Params: { id: string } }>("/admin/products/:id/toggle", async (req, reply) => {
    if (!(await requireAuth(req, reply))) return;
    try {
      const p = await toggleProductActive(req.params.id);
      setFlash(reply, {
        kind: "success",
        message: `Produk "${p.id}" ${p.active ? "diaktifkan" : "dinonaktifkan"}`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setFlash(reply, { kind: "error", message: msg });
    }
    return reply.redirect("/admin/products");
  });

  // === Stock per product ===
  app.get<{ Params: { id: string } }>("/admin/products/:id/stock", async (req, reply) => {
    if (!(await requireAuth(req, reply))) return;
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) {
      return reply.code(404).type("text/html").send("<h1>Produk tidak ditemukan</h1>");
    }
    const stocks = await getStockForProduct(product.id, { take: 100 });
    const available = stocks.filter((s) => !s.used).length;
    const sold = stocks.filter((s) => s.used).length;
    const flash = popFlash(req, reply);
    return reply.type("text/html").send(renderStock({ product, stocks, available, sold, flash }));
  });

  app.post<{ Params: { id: string }; Body: { payloads?: string } }>(
    "/admin/products/:id/stock",
    async (req, reply) => {
      if (!(await requireAuth(req, reply))) return;
      try {
        const lines = (req.body?.payloads ?? "").split(/\r?\n/);
        const added = await addStock(req.params.id, lines);
        setFlash(reply, { kind: "success", message: `${added} item stok ditambahkan` });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setFlash(reply, { kind: "error", message: msg });
      }
      return reply.redirect(`/admin/products/${encodeURIComponent(req.params.id)}/stock`);
    },
  );

  // === Orders ===
  app.get<{ Querystring: { status?: string } }>("/admin/orders", async (req, reply) => {
    if (!(await requireAuth(req, reply))) return;
    const status = req.query.status?.toUpperCase();
    const orders = await listRecentOrders({ status, take: 100 });
    const flash = popFlash(req, reply);
    return reply.type("text/html").send(renderOrders({ orders, filterStatus: status, flash }));
  });

  app.post<{ Params: { id: string } }>("/admin/orders/:id/redeliver", async (req, reply) => {
    if (!(await requireAuth(req, reply))) return;
    try {
      await redeliverOrder(req.params.id);
      setFlash(reply, {
        kind: "success",
        message: `Order ${req.params.id} berhasil dikirim ulang`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      logger.error({ err, orderId: req.params.id }, "Redeliver failed");
      setFlash(reply, { kind: "error", message: `Redeliver gagal: ${msg}` });
    }
    return reply.redirect("/admin/orders");
  });
}
