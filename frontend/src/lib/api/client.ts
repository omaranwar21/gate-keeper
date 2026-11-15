import axios from "axios";
import { ApiError } from "./error";
import type { ApiErrorBody } from "@/types/api";

/**
 * Browser-side axios instance. It only ever talks to this Next.js app's own
 * `/api/*` route handlers (same origin, no CORS needed) — those handlers are
 * the ones that attach the Bearer token and call the real backend.
 */
export const apiClient = axios.create({
  baseURL: "/api",
});

// Lets the backend translate error messages: the locale layout sets
// <html lang>, so it's always in sync with the active [locale] segment.
// The /api/* route handlers forward this header on to the real backend.
apiClient.interceptors.request.use((config) => {
  config.headers["Content-Language"] = document.documentElement.lang;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response) {
      const body = (error.response.data ?? {
        statusCode: error.response.status,
        message: error.message,
        error: "Error",
      }) as ApiErrorBody;
      return Promise.reject(new ApiError(error.response.status, body));
    }
    return Promise.reject(
      new ApiError(0, { statusCode: 0, message: "Network error", error: "Network" }),
    );
  },
);
