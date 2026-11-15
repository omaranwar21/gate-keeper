import "server-only";
import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";
import { decodeJwtPayload, isExpired } from "./jwt";
import { ROLE_HOME, SESSION_COOKIE } from "./constants";
import { redirect } from "@/i18n/navigation";
import type { JwtPayload, Role } from "@/types/api";

export async function getSessionPayload(): Promise<JwtPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  if (!payload || isExpired(payload)) return null;

  return payload;
}

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

/** Defense-in-depth re-check for each role's segment layout — the proxy
 * (middleware) already gates these paths by role; this catches the edge
 * case of a stale/cleared cookie slipping past it. */
export async function requireRole(role: Role): Promise<JwtPayload> {
  const maybeSession = await getSessionPayload();
  const locale = await getLocale();

  if (!maybeSession) {
    redirect({ href: "/login", locale });
  }
  const session = maybeSession as JwtPayload;

  if (session.role !== role) {
    redirect({ href: ROLE_HOME[session.role], locale });
  }

  return session;
}
