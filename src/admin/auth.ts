import { adminDiscordIds, adminTelegramIds } from "../config.js";

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
