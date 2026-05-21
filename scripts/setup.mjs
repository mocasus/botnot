#!/usr/bin/env node
/**
 * Setup launcher: start dev server + auto-open browser ke /setup.
 * Cross-platform (macOS / Linux / Windows).
 *
 * Usage: npm run setup
 */
import { spawn } from "node:child_process";
import { existsSync, copyFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const cwd = process.cwd();
const envPath = resolve(cwd, ".env");
const examplePath = resolve(cwd, ".env.example");

// 1. Pastikan .env ada
if (!existsSync(envPath)) {
  if (existsSync(examplePath)) {
    copyFileSync(examplePath, envPath);
    console.log("Created .env from .env.example");
  } else {
    console.error("ERROR: .env.example not found in", cwd);
    process.exit(1);
  }
}

// 2. Tentukan PORT dari .env (default 3000)
const envContent = readFileSync(envPath, "utf-8");
const portMatch = envContent.match(/^PORT=(\d+)/m);
const port = portMatch ? portMatch[1] : "3000";
const setupUrl = `http://localhost:${port}/setup`;

console.log("\nStarting botnot dev server, then opening", setupUrl, "...\n");

// 3. Start server
const server = spawn("npx", ["tsx", "src/index.ts"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

// 4. Open browser setelah server siap (1.5 detik delay)
setTimeout(() => {
  const opener =
    process.platform === "darwin"
      ? ["open", [setupUrl]]
      : process.platform === "win32"
        ? ["cmd", ["/c", "start", "", setupUrl]]
        : ["xdg-open", [setupUrl]];

  spawn(opener[0], opener[1], { stdio: "ignore", detached: true })
    .on("error", () => {
      console.log(`\n  Buka manual: ${setupUrl}\n`);
    })
    .unref();
}, 1500);

// 5. Forward signals
const forward = (sig) => {
  if (!server.killed) server.kill(sig);
};
process.on("SIGINT", () => forward("SIGINT"));
process.on("SIGTERM", () => forward("SIGTERM"));
server.on("exit", (code) => process.exit(code ?? 0));
