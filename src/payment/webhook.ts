import type { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { logger } from "../logger.js";
import { markOrderExpired, markOrderPaid } from "../orders/service.js";
import { deliverOrder } from "../orders/delivery.js";
import { parseWIBDate } from "./klikqris.js";

interface WebhookPayload {
  order_id: string;
  status: string;        // "PAID" | "SUCCESS" | "EXPIRED"
  amount: number;
  total_amount: number;
  payment_date?: string; // "2026-01-25 21:48:01" (WIB)
  signature: string;
  keterangan?: string;
  direct_url?: string;
  created_at?: string;
  updated_at?: string;
}

export function registerWebhookRoutes(app: FastifyInstance): void {
  // Healthcheck
  app.get("/health", async () => ({ ok: true }));

  // Webhook KlikQRIS
  app.post<{ Body: WebhookPayload }>("/webhook/klikqris", async (req, reply) => {
    const payload = req.body;
    if (!payload?.order_id || !payload?.status) {
      logger.warn({ body: req.body }, "Webhook payload invalid");
      // tetap 200 supaya KlikQRIS tidak retry forever
      return reply.code(200).send({ ok: false, reason: "invalid payload" });
    }

    logger.info(
      { orderId: payload.order_id, status: payload.status },
      "Webhook diterima",
    );

    const order = await prisma.order.findUnique({
      where: { id: payload.order_id },
    });

    if (!order) {
      logger.warn({ orderId: payload.order_id }, "Order tidak dikenal, abaikan");
      return reply.code(200).send({ ok: true });
    }

    // === Validasi signature (Double Security) ===
    if (!order.signature || order.signature !== payload.signature) {
      logger.error(
        { orderId: payload.order_id },
        "Signature tidak cocok, kemungkinan fake webhook. Diabaikan.",
      );
      return reply.code(200).send({ ok: false, reason: "invalid signature" });
    }

    const status = payload.status.toUpperCase();

    if (status === "PAID" || status === "SUCCESS") {
      const result = await markOrderPaid(
        payload.order_id,
        parseWIBDate(payload.payment_date) ?? undefined,
      );
      if (!result) {
        return reply.code(200).send({ ok: true });
      }
      if (result.alreadyPaid) {
        logger.info(
          { orderId: payload.order_id },
          "Sudah PAID sebelumnya, skip delivery (idempotent)",
        );
        return reply.code(200).send({ ok: true });
      }
      // Delivery async — jangan blocking response ke KlikQRIS
      deliverOrder(payload.order_id).catch((err) =>
        logger.error({ err, orderId: payload.order_id }, "Delivery error"),
      );
      return reply.code(200).send({ ok: true });
    }

    if (status === "EXPIRED") {
      await markOrderExpired(payload.order_id);
      logger.info({ orderId: payload.order_id }, "Order expired");
      return reply.code(200).send({ ok: true });
    }

    // Status lain — log & ack
    logger.info({ orderId: payload.order_id, status }, "Webhook status unhandled, ack");
    return reply.code(200).send({ ok: true });
  });
}
