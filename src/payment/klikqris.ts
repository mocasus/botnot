import axios, { type AxiosInstance } from "axios";
import { config } from "../config.js";
import { logger } from "../logger.js";

/**
 * KlikQRIS API Client
 * Docs: https://klikqris.com/dokumentasi
 */

export interface CreateTxData {
  order_id: string;
  nama_toko: string;
  tanggal: string;
  amount: string;        // string desimal "1000.00"
  amount_uniq: string;   // unique fee, ex: "16.00"
  total_amount: string;  // total final, ex: "1016.00"
  status: string;        // "PENDING"
  qris_url: string;
  qris_image: string;    // data:image/png;base64,...
  expired_at: string;    // "2026-05-22 02:11:50" (WIB)
  paid_at: string | null;
  signature: string;
  keterangan: string;
  redirect_url: string;
  expired_menit: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTxResponse {
  status: boolean;
  message: string;
  data: CreateTxData;
}

export interface StatusResponse {
  status: boolean;
  message: string;
  data: {
    order_id: string;
    status: string; // PENDING | SUCCESS | EXPIRED
    paid_at: string | null;
    total_amount: string;
    signature: string;
  } & Record<string, unknown>;
}

let client: AxiosInstance | null = null;

function http(): AxiosInstance {
  if (client) return client;
  client = axios.create({
    baseURL: config.KLIKQRIS_API_BASE,
    timeout: 15_000,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.KLIKQRIS_API_KEY,
      id_merchant: config.KLIKQRIS_MERCHANT_ID,
    },
  });
  return client;
}

export async function createTransaction(params: {
  orderId: string;
  amount: number;
  keterangan?: string;
}): Promise<CreateTxData> {
  const body = {
    order_id: params.orderId,
    id_merchant: Number(config.KLIKQRIS_MERCHANT_ID),
    amount: params.amount,
    keterangan: params.keterangan,
  };
  logger.debug({ orderId: params.orderId, amount: params.amount }, "KlikQRIS createTransaction");
  const { data } = await http().post<CreateTxResponse>("/qris/create", body);
  if (!data.status) {
    throw new Error(`KlikQRIS create gagal: ${data.message}`);
  }
  return data.data;
}

export async function getTransactionStatus(orderId: string): Promise<StatusResponse["data"]> {
  const { data } = await http().get<StatusResponse>(`/qris/status/${encodeURIComponent(orderId)}`);
  if (!data.status) {
    throw new Error(`KlikQRIS status gagal: ${data.message}`);
  }
  return data.data;
}

/**
 * Parse string amount "1016.00" → 1016 (IDR int).
 */
export function parseRupiah(value: string | number): number {
  if (typeof value === "number") return Math.round(value);
  return Math.round(parseFloat(value));
}

/**
 * Parse "2026-05-22 02:11:50" (WIB) → Date.
 */
export function parseWIBDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const iso = s.replace(" ", "T") + "+07:00";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}
