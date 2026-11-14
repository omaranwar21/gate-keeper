import type { ApiErrorBody } from "@/types/api";

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(Array.isArray(body.message) ? body.message[0] : body.message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** Normalizes the backend's `message: string | string[]` into a flat list. */
export function apiErrorMessages(error: unknown): string[] {
  if (!isApiError(error)) return [];
  return Array.isArray(error.body.message) ? error.body.message : [error.body.message];
}
