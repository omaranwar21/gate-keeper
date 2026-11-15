import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { AppShell } from "@/components/shell/app-shell";

export default async function ResidentLayout({ children }: { children: React.ReactNode }) {
  await requireRole("resident");
  const t = await getTranslations("app");

  return (
    <AppShell role="resident" appName={t("name")}>
      {children}
    </AppShell>
  );
}
