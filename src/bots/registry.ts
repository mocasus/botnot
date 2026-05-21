import type { Bot } from "grammy";
import type { Client } from "discord.js";

/**
 * Shared registry untuk akses bot instances dari module lain
 * (misal: webhook handler perlu kirim DM saat order PAID).
 */
export const registry: { telegram?: Bot; discord?: Client } = {};
