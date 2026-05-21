#!/usr/bin/env node
/**
 * Setup launcher: bikin .env, migrate DB, start dev server, auto-open browser ke /setup.
 * Cross-platform (macOS / Linux / Windows).
 *
 * Usage: npm run setup
 *
 * Yang script ini lakukan:
 *   1. Bikin .env dari .env.example kalau belum ada
 *   2. Jalanin `prisma db push` (idempoten — aman kalau DB sudah ada)
 *   3. Start dev server (tsx watch src/index.ts)
 *   4. Auto-buka browser ke http://localhost:PORT/setup
 *
 * Penting: .env harus ada SEBELUM prisma jalan, karena Prisma CLI baca DATABASE_URL
 * langsung dari .env (bukan dari config zod aplikasi).
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, copyFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const cwd = process.cwd();
const envPath = resolve(cwd, ".env");
const examplePath = resolve(cwd, ".env.example");
const isWindows = process.platform === "win32";

// === 1. Pastikan .env ada ===
if (!existsSync(envPath)) {
  if (!existsSync(examplePath)) {
    console.error("\nERROR: .env.example tidak ditemukan di", cwd);
    console.error("Pastikan kamu jalanin command ini dari root project (folder yang ada package.json).\n");
    process.exit(1);
  }
  copyFileSync(examplePath, envPath);
  console.log("\n  ✓ .env dibuat dari .env.example");
} else {
  console.log("\n  ✓ .env sudah ada");
}

// === 2. Migrate DB ===
console.log("  ⏳ Migrating database (prisma db push)...");
const dbPush = spawnSync("npx", ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"], {
  stdio: ["ignore", "pipe", "pipe"],
  shell: isWindows,
  encoding: "utf-8",
});
if (dbPush.status !== 0) {
  console.error("\nERROR: prisma db push gagal.");
  console.error(dbPush.stderr || dbPush.stdout);
  console.error("\nCek DATABASE_URL di .env, lalu coba lagi.\n");
  process.exit(1);
}
console.log("  ✓ Database siap\n");

// === 3. Tentukan PORT dari .env (default 3000) ===
const envContent = readFileSync(envPath, "utf-8");
const portMatch = envContent.match(/^PORT=(\d+)/m);
const port = portMatch ? portMatch[1] : "3000";
const setupUrl = `http://localhost:${port}/setup`;

console.log(`Starting dev server, then opening:\n  → ${setupUrl}\n`);

// === 4. Start server ===
const server = spawn("npx", ["tsx", "src/index.ts"], {
  stdio: "inherit",
  shell: isWindows,
});

// === 5. Buka browser setelah server siap (2 detik delay) ===
setTimeout(() => {
  const opener = isWindows
    ? ["cmd", ["/c", "start", "", setupUrl]]
    : process.platform === "darwin"
      ? ["open", [setupUrl]]
      : ["xdg-open", [setupUrl]];

  const child = spawn(opener[0], opener[1], {
    stdio: "ignore",
    detached: true,
    shell: isWindows,
  });
  child.on("error", () => {
    console.log(`\n  ⚠  Auto-open browser gagal. Buka manual: ${setupUrl}\n`);
  });
  child.unref();
}, 2000);

// === 6. Forward signals ke child server ===
const forward = (sig) => {
  if (server && !server.killed) server.kill(sig);
};
process.on("SIGINT", () => forward("SIGINT"));
process.on("SIGTERM", () => forward("SIGTERM"));
server.on("exit", (code) => process.exit(code ?? 0));
