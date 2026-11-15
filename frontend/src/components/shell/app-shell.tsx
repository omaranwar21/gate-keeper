"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Menu, ShieldCheck } from "lucide-react";
import { localeDirection, type AppLocale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { LocaleSwitcher } from "@/components/shell/locale-switcher";
import { LogoutButton } from "@/components/shell/logout-button";
import { UserBadge } from "@/components/shell/user-badge";
import { SessionHydrator } from "@/components/providers/session-hydrator";
import { NAV_BY_ROLE } from "@/lib/config/nav";
import type { Role } from "@/types/api";

export function AppShell({
  role,
  appName,
  children,
}: {
  role: Role;
  appName: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const locale = useLocale() as AppLocale;
  const sheetSide = localeDirection[locale] === "rtl" ? "right" : "left";
  const nav = NAV_BY_ROLE[role];

  return (
    <div className="flex min-h-dvh">
      <SessionHydrator />

      <aside className="hidden w-64 shrink-0 flex-col gap-6 bg-sidebar px-4 py-6 text-sidebar-foreground md:flex">
        <Brand appName={appName} />
        <SidebarNav items={nav} />
        <div className="mt-auto space-y-3 border-t border-sidebar-border pt-4">
          <UserBadge role={role} />
        </div>
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side={sheetSide} className="w-64 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
          <SheetHeader className="px-4 pt-6">
            <SheetTitle className="text-sidebar-foreground">
              <Brand appName={appName} />
            </SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            <SidebarNav items={nav} onNavigate={() => setMobileOpen(false)} />
          </div>
          <div className="mt-auto space-y-3 border-t border-sidebar-border px-4 py-4">
            <UserBadge role={role} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label={appName}
          >
            <Menu className="size-5" />
          </Button>
          <div className="md:hidden">
            <Brand appName={appName} compact />
          </div>
          <div className="ms-auto flex items-center gap-1">
            <LocaleSwitcher />
            <LogoutButton />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

function Brand({ appName, compact }: { appName: string; compact?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sidebar-foreground">
      <ShieldCheck className="size-5 text-sidebar-primary" />
      {!compact && <span className="text-base font-semibold tracking-tight">{appName}</span>}
    </div>
  );
}
