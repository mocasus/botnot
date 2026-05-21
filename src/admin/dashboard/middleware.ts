import type { FastifyReply, FastifyRequest } from "fastify";
import { config, isDashboardConfigured } from "../../config.js";

export const SESSION_COOKIE = "botnot_admin";
export const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 hari

/**
 * Constant-time string compare untuk mencegah timing attack.
 */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function checkCredentials(username: string, password: string): boolean {
  if (!isDashboardConfigured()) return false;
  return safeEqual(username, config.ADMIN_USERNAME) && safeEqual(password, config.ADMIN_PASSWORD);
}

export function isAuthenticated(req: FastifyRequest): boolean {
  const cookie = req.cookies?.[SESSION_COOKIE];
  if (!cookie) return false;
  // Verifikasi signed cookie (Fastify auto-verifies via unsignCookie)
  const unsigned = req.unsignCookie(cookie);
  return unsigned.valid && unsigned.value === "ok";
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply): Promise<boolean> {
  if (!isDashboardConfigured()) {
    reply
      .code(503)
      .type("text/html")
      .send(
        "<h1>Dashboard belum dikonfigurasi</h1><p>Set ADMIN_USERNAME dan ADMIN_PASSWORD di .env</p>",
      );
    return false;
  }
  if (!isAuthenticated(req)) {
    reply.redirect("/admin/login");
    return false;
  }
  return true;
}
