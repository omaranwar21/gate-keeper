"use client";

import { useEffect } from "react";
import { apiClient } from "@/lib/api/client";
import { useSessionStore, type SessionUser } from "@/store/session-store";

/** Fetches `/api/auth/me` once on mount so client components can read the
 * current user from the Zustand store without prop-drilling it down from
 * the server-rendered layout. */
export function SessionHydrator() {
  const setUser = useSessionStore((state) => state.setUser);

  useEffect(() => {
    let cancelled = false;

    apiClient
      .get<SessionUser>("/auth/me")
      .then((response) => {
        if (!cancelled) setUser(response.data);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });

    return () => {
      cancelled = true;
    };
  }, [setUser]);

  return null;
}
