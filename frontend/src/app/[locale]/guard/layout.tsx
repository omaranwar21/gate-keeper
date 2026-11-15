import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { AppShell } from "@/components/shell/app-shell";

export default async function GuardLayout({ children }: { children: React.ReactNode }) {
  await requireRole("guard");
  const t = await getTranslations("app");

  return (
    <AppShell role="guard" appName={t("name")}>
      {children}
    </AppShell>
  );
}
