import "server-only";
import axios from "axios";

/**
 * Server-only axios instance that talks directly to the NestJS API. Only
 * ever used inside Next.js route handlers (the BFF layer) — never imported
 * by client components.
 */
export const backendApi = axios.create({
  baseURL: `${process.env.BACKEND_URL}/v1`,
  validateStatus: () => true,
});

export function authHeader(token: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
