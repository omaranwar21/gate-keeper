"use client";

import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSessionStore } from "@/store/session-store";
import type { Role } from "@/types/api";

function initialsFromEmail(email: string) {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0][0], parts[1][0]] : [local[0], local[1]];
  return letters.filter(Boolean).join("").toUpperCase();
}

export function UserBadge({ role }: { role: Role }) {
  const t = useTranslations("roles");
  const email = useSessionStore((state) => state.user?.email);

  return (
    <div className="flex items-center gap-2.5">
      <Avatar className="size-8 bg-primary/10">
        <AvatarFallback className="bg-transparent text-xs font-semibold text-primary">
          {email ? initialsFromEmail(email) : "—"}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm font-medium text-foreground">{email ?? "…"}</p>
        <p className="text-xs text-muted-foreground">{t(role)}</p>
      </div>
    </div>
  );
}
