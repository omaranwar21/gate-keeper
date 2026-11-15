import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { decodeJwtPayload, isExpired } from "@/lib/auth/jwt";
import { SESSION_COOKIE, ROLE_HOME } from "@/lib/auth/constants";
import type { Role } from "@/types/api";

const intlMiddleware = createIntlMiddleware(routing);

const ROLE_PREFIX: Record<Role, string> = {
  admin: "/admin",
  resident: "/resident",
  guard: "/guard",
};

function roleFromPath(pathWithoutLocale: string): Role | null {
  for (const role of Object.keys(ROLE_PREFIX) as Role[]) {
    if (pathWithoutLocale.startsWith(ROLE_PREFIX[role])) return role;
  }
  return null;
}

export default function proxy(request: NextRequest) {
  const intlResponse = intlMiddleware(request);

  const { pathname } = request.nextUrl;
  const segments = pathname.split("/").filter(Boolean);
  const locale = routing.locales.includes(segments[0] as never)
    ? segments[0]
    : routing.defaultLocale;
  const pathWithoutLocale = "/" + segments.slice(routing.locales.includes(segments[0] as never) ? 1 : 0).join("/");

  const isRoot = pathWithoutLocale === "/";
  const isLoginPath = pathWithoutLocale === "/login";
  const requiredRole = roleFromPath(pathWithoutLocale);

  if (!requiredRole && !isRoot && !isLoginPath) {
    return intlResponse;
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const payload = token ? decodeJwtPayload(token) : null;
  const session = payload && !isExpired(payload) ? payload : null;

  if (!session) {
    if (isLoginPath) return intlResponse;
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    return NextResponse.redirect(url);
  }

  if (isRoot) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${ROLE_HOME[session.role]}`;
    return NextResponse.redirect(url);
  }

  if (isLoginPath || (requiredRole && requiredRole !== session.role)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${ROLE_HOME[session.role]}`;
    return NextResponse.redirect(url);
  }

  return intlResponse;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
