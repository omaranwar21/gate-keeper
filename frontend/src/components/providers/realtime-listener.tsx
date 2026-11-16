"use client";

import { useEffect, useEffectEvent } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { toast } from "sonner";
import type { AccessLog, Role } from "@/types/api";

const ACCESS_LOG_CREATED = "access-log:created";

type SocketAuth = { url: string; token: string };

async function fetchSocketAuth(): Promise<SocketAuth | null> {
  const response = await fetch("/api/auth/socket").catch(() => null);
  return response?.ok ? response.json() : null;
}

/** Listens for new scans over the realtime socket (admins: every scan,
 * residents: scans for their units), shows a toast and refetches whatever
 * data the scan changed. Renders nothing. */
export function RealtimeListener({ role }: { role: Role }) {
  const queryClient = useQueryClient();
  const t = useTranslations("realtime");
  const tReason = useTranslations("guard.reasons");

  // An effect event, so switching locale updates the toast language
  // without reconnecting the socket.
  const onAccessLog = useEffectEvent((log: AccessLog) => {
    const values = { guest: log.guestName ?? "", unit: log.unit?.number ?? "" };

    if (log.result === "allowed") {
      toast.success(
        role === "resident"
          ? t("residentEntered", values)
          : t("adminEntered", values),
      );
    } else if (log.reason === "invalid_token") {
      toast.error(t("unknownCode"));
    } else {
      toast.error(
        t("denied", {
          ...values,
          reason: log.reason ? tReason(log.reason) : "",
        }),
      );
    }

    queryClient.invalidateQueries({ queryKey: ["access-log"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["passes"] });
  });

  useEffect(() => {
    let socket: ReturnType<typeof io> | null = null;
    let cancelled = false;

    fetchSocketAuth().then((first) => {
      if (!first || cancelled) return;

      socket = io(first.url, {
        transports: ["websocket"],
        // Called on every (re)connect, so a reconnect after the API wakes
        // up or restarts always carries the current session token.
        auth: (callback) => {
          fetchSocketAuth().then((auth) => callback({ token: auth?.token }));
        },
      });

      socket.on(ACCESS_LOG_CREATED, onAccessLog);
    });

    return () => {
      cancelled = true;
      socket?.disconnect();
    };
  }, []);

  return null;
}
