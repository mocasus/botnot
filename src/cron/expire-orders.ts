import { prisma } from "../db.js";
import { logger } from "../logger.js";

/**
 * Background job: tandai order PENDING yang sudah lewat expiredAt jadi EXPIRED.
 * Jalan tiap 60 detik (interval cukup karena KlikQRIS QRIS expiry default 60 menit).
 * Idempoten — kalau gak ada order yang expired, no-op.
 */
const INTERVAL_MS = 60_000; // 1 menit

let timer: NodeJS.Timeout | null = null;

export function startExpireOrdersCron(): void {
  if (timer) return; // sudah jalan
  // Run sekali saat startup, lalu interval
  void tick();
  timer = setInterval(() => void tick(), INTERVAL_MS);
  logger.info({ intervalMs: INTERVAL_MS }, "Expire-orders cron started");
}

export function stopExpireOrdersCron(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

async function tick(): Promise<void> {
  try {
    const now = new Date();
    const result = await prisma.order.updateMany({
      where: {
        status: "PENDING",
        expiredAt: { lt: now, not: null },
      },
      data: { status: "EXPIRED" },
    });
    if (result.count > 0) {
      logger.info({ count: result.count }, "Auto-expired stale PENDING orders");
    }
  } catch (err) {
    logger.error({ err }, "Expire-orders cron tick failed");
  }
}
