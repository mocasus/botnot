import pino from "pino";
import { config } from "./config.js";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  transport:
    config.NODE_ENV !== "production"
      ? { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:HH:MM:ss" } }
      : undefined,
});
