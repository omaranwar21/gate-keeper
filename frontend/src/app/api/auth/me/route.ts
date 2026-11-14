import { NextResponse, type NextRequest } from "next/server";
import { backendApi, authHeader, contentLanguageHeader } from "@/lib/api/backend";
import { getSessionToken } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const token = await getSessionToken();

  if (!token) {
    return NextResponse.json(
      { statusCode: 401, message: "Unauthorized", error: "Unauthorized" },
      { status: 401 },
    );
  }

  const backendResponse = await backendApi.get("/users/profile", {
    headers: {
      ...authHeader(token),
      ...contentLanguageHeader(request.headers.get("content-language")),
    },
  });

  return NextResponse.json(backendResponse.data, { status: backendResponse.status });
}
