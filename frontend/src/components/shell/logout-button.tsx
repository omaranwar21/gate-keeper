"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api/client";
import { useRouter } from "@/i18n/navigation";
import { useSessionStore } from "@/store/session-store";

export function LogoutButton() {
  const t = useTranslations("common");
  const router = useRouter();
  const setUser = useSessionStore((state) => state.setUser);
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await apiClient.post("/auth/logout");
    } finally {
      setUser(null);
      router.replace("/login");
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout} disabled={loading}>
      <LogOut className="size-4" />
      {t("logout")}
    </Button>
  );
}
