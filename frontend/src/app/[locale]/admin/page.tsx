"use client";

import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { DoorOpen, ShieldX, Ticket } from "lucide-react";
import { PageHeader } from "@/components/design-system/page-header";
import { StatTileGrid, type StatTileConfig } from "@/components/design-system/stat-tile";
import { EmptyState, PendingBackendState } from "@/components/design-system/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/query/keys";
import { formatCairoDateTime } from "@/lib/dates";

export default function AdminDashboardPage() {
  const t = useTranslations("admin.dashboard");
  const tPasses = useTranslations("passes");
  const locale = useLocale();

  const query = useQuery({
    queryKey: queryKeys.dashboard.summary,
    queryFn: dashboardApi.summary,
    retry: false,
  });

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("title")} description={t("subtitle")} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("title")} description={t("subtitle")} />
        <PendingBackendState title={t("title")} description={t("pendingEndpoint")} />
      </div>
    );
  }

  const summary = query.data;
  const tiles: StatTileConfig[] = [
    { key: "entries", label: t("entriesToday"), value: summary.entriesToday, icon: DoorOpen, tone: "default" },
    { key: "denied", label: t("deniedToday"), value: summary.deniedToday, icon: ShieldX, tone: "danger" },
    { key: "active", label: t("activePasses"), value: summary.activePasses, icon: Ticket, tone: "success" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <StatTileGrid tiles={tiles} />

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 text-sm font-medium text-foreground">{t("expectedVisitors")}</h2>
        {summary.expectedVisitors.length === 0 ? (
          <EmptyState title={t("noVisitors")} />
        ) : (
          <ul className="space-y-2">
            {summary.expectedVisitors.map((visitor) => (
              <li
                key={visitor.passId}
                className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{visitor.guestName}</p>
                  <p className="text-xs text-muted-foreground">
                    {visitor.buildingName} · {visitor.unitNumber} ·{" "}
                    {visitor.type === "one_time" ? tPasses("oneTime") : tPasses("recurring")}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatCairoDateTime(visitor.validFrom, locale)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
