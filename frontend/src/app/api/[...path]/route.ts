import { NextResponse, type NextRequest } from "next/server";
import { backendApi, authHeader, contentLanguageHeader } from "@/lib/api/backend";
import { getSessionToken } from "@/lib/auth/session";

async function proxy(request: NextRequest, segments: string[]) {
  const token = await getSessionToken();
  const path = segments.join("/");
  const search = request.nextUrl.search;

  const hasBody = request.method !== "GET" && request.method !== "DELETE";
  const body = hasBody ? await request.json().catch(() => undefined) : undefined;

  const backendResponse = await backendApi.request({
    url: `/${path}${search}`,
    method: request.method,
    data: body,
    headers: {
      ...authHeader(token),
      ...contentLanguageHeader(request.headers.get("content-language")),
    },
  });

  return NextResponse.json(backendResponse.data, { status: backendResponse.status });
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: RouteContext) {
  return proxy(request, (await context.params).path);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxy(request, (await context.params).path);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxy(request, (await context.params).path);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxy(request, (await context.params).path);
}
