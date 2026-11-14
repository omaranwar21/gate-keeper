import { NextResponse, type NextRequest } from "next/server";
import { backendApi, contentLanguageHeader } from "@/lib/api/backend";
import { decodeJwtPayload } from "@/lib/auth/jwt";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import type { ApiErrorBody, SuccessEnvelope } from "@/types/api";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const backendResponse = await backendApi.post("/auth/login", body, {
    headers: contentLanguageHeader(request.headers.get("content-language")),
  });

  if (backendResponse.status !== 200) {
    return NextResponse.json(backendResponse.data as ApiErrorBody, {
      status: backendResponse.status,
    });
  }

  const { data, message } = backendResponse.data as SuccessEnvelope<{ accessToken: string }>;
  const payload = decodeJwtPayload(data.accessToken);

  if (!payload) {
    return NextResponse.json(
      { statusCode: 502, message: "Received an invalid token from the server.", error: "Bad Gateway" },
      { status: 502 },
    );
  }

  const response = NextResponse.json({ role: payload.role, message });
  const maxAge = payload.exp ? Math.max(payload.exp - Math.floor(Date.now() / 1000), 0) : 60 * 60;

  response.cookies.set(SESSION_COOKIE, data.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });

  return response;
}
