import { adminDiscordIds, adminTelegramIds, isOwnerDiscord, isOwnerTelegram } from "../config.js";

export function isTelegramAdmin(userId: string | number | undefined): boolean {
  if (userId === undefined) return false;
  return adminTelegramIds.has(String(userId));
}

export function isDiscordAdmin(userId: string | undefined): boolean {
  if (!userId) return false;
  return adminDiscordIds.has(userId);
}

export function hasTelegramAdmins(): boolean {
  return adminTelegramIds.size > 0;
}

export function hasDiscordAdmins(): boolean {
  return adminDiscordIds.size > 0;
}

/** Cek apakah user adalah owner (primary admin), bukan admin biasa. */
export { isOwnerTelegram, isOwnerDiscord };

/** Label role untuk command /whoami. */
export function telegramRole(userId: string | number | undefined): "owner" | "admin" | "customer" {
  if (isOwnerTelegram(userId)) return "owner";
  if (isTelegramAdmin(userId)) return "admin";
  return "customer";
}

export function discordRole(userId: string | undefined): "owner" | "admin" | "customer" {
  if (isOwnerDiscord(userId)) return "owner";
  if (isDiscordAdmin(userId)) return "admin";
  return "customer";
}
