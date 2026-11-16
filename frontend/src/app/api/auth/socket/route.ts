import { NextResponse } from "next/server";
import { getSessionPayload, getSessionToken } from "@/lib/auth/session";

/**
 * Hands the browser what it needs to open the realtime WebSocket. Vercel
 * can't proxy WebSockets, so the socket has to go straight to the NestJS
 * API, which means the browser needs the JWT itself here — the one place
 * the httpOnly session token is exposed to page JavaScript.
 */
export async function GET() {
  const token = await getSessionToken();

  if (!token || !(await getSessionPayload())) {
    return NextResponse.json(
      { statusCode: 401, message: "Unauthorized", error: "Unauthorized" },
      { status: 401 },
    );
  }

  // BACKEND_URL is how *this server* reaches the API (e.g. the Docker
  // Compose service name `backend`, unreachable from the browser). The
  // socket connects from the browser instead, so it needs an origin the
  // browser can actually resolve — BACKEND_PUBLIC_URL when the two differ,
  // falling back to BACKEND_URL when they're already the same (plain local
  // dev, and production, where BACKEND_URL is already a public API URL).
  const backendUrl = process.env.BACKEND_PUBLIC_URL ?? process.env.BACKEND_URL!;
  return NextResponse.json({ url: new URL(backendUrl).origin, token });
}
