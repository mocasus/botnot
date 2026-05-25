import type { FastifyInstance, FastifyRequest } from "fastify";
import { config, isDashboardConfigured } from "../config.js";
import { logger } from "../logger.js";
import { ALLOWED_ENV_KEYS, readEnvFile, writeEnvFile, generateSecret } from "./env-writer.js";
import { renderSetupPage } from "./page.js";

/**
 * Cek apakah setup wizard available di request ini.
 *
 * Boleh diakses kalau:
 *   - Belum dikonfigurasi (first-run), ATAU
 *   - NODE_ENV=development (untuk reconfigure)
 *
 * Di production yg sudah configured, redirect ke /admin/login.
 */
function isSetupAllowed(): boolean {
  if (!isDashboardConfigured()) return true;
  if (config.NODE_ENV === "development") return true;
  return false;
}

export function registerSetupRoutes(app: FastifyInstance): void {
  app.get("/setup", async (req, reply) => {
    if (!isSetupAllowed()) {
      return reply.redirect("/admin/login");
    }
    const current = readEnvFile();
    return reply.type("text/html").send(renderSetupPage({ current }));
  });

  app.post<{ Body: Record<string, string> }>("/setup", async (req, reply) => {
    if (!isSetupAllowed()) {
      return reply
        .code(403)
        .type("text/html")
        .send("<h1>Setup wizard disabled</h1><p>Sudah configured. Hapus ADMIN_USERNAME di .env untuk re-enable, atau set NODE_ENV=development.</p>");
    }

    const body = req.body ?? {};
    const merged = readEnvFile();

    // Hanya update key yg ada di allowlist
    for (const key of ALLOWED_ENV_KEYS) {
      const incoming = body[key];
      if (incoming !== undefined) {
        merged.set(key, incoming.trim());
      }
    }

    // Auto-generate session secret kalau dikosongkan
    if (!merged.get("ADMIN_SESSION_SECRET")) {
      merged.set("ADMIN_SESSION_SECRET", generateSecret());
    }

    // Validasi minimal: dashboard wajib punya username + password
    const errors: string[] = [];
    if (!merged.get("ADMIN_USERNAME")) errors.push("Admin Dashboard Username wajib diisi");
    if (!merged.get("ADMIN_PASSWORD")) errors.push("Admin Dashboard Password wajib diisi");
    if ((merged.get("ADMIN_PASSWORD") ?? "").length < 8) {
      errors.push("Admin Dashboard Password minimal 8 karakter");
    }

    if (errors.length > 0) {
      return reply
        .type("text/html")
        .send(
          renderSetupPage({
            current: merged,
            flash: { kind: "error", message: errors.join(" · ") },
          }),
        );
    }

    try {
      const { backupPath } = writeEnvFile(merged);
      logSetupChanges(merged, req);
      return reply.type("text/html").send(
        renderSetupPage({
          current: merged,
          saved: true,
          backupPath,
        }),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      logger.error({ err }, "Setup wizard write failed");
      return reply.type("text/html").send(
        renderSetupPage({
          current: merged,
          flash: { kind: "error", message: `Gagal tulis .env: ${msg}` },
        }),
      );
    }
  });
}

function logSetupChanges(values: Map<string, string>, req: FastifyRequest) {
  const summary: Record<string, string> = {};
  for (const key of ALLOWED_ENV_KEYS) {
    const v = values.get(key) ?? "";
    summary[key] = isSensitive(key) ? (v ? "<set>" : "<empty>") : v || "<empty>";
  }
  logger.info({ ip: req.ip, summary }, "Setup wizard saved configuration");
}

function isSensitive(key: string): boolean {
  return /KEY|TOKEN|PASSWORD|SECRET/.test(key);
}
