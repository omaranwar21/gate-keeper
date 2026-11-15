import type { JwtPayload } from "@/types/api";

/**
 * Decodes a JWT payload without verifying the signature. This is a routing
 * hint only — the backend is the sole source of truth for authorization, and
 * every API call still carries the raw token for it to verify.
 */
export function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const json = atob(padded);
    const payload = JSON.parse(json) as JwtPayload;
    if (!payload.sub || !payload.role) return null;
    return payload;
  } catch {
    return null;
  }
}

export function isExpired(payload: JwtPayload): boolean {
  if (!payload.exp) return false;
  return payload.exp * 1000 <= Date.now();
}
