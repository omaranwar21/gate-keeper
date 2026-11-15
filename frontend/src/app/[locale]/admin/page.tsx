"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DoorOpen, ShieldX, Ticket } from "lucide-react";
import { PageHeader } from "@/components/design-system/page-header";
import { StatTileGrid, type StatTileConfig } from "@/components/design-system/stat-tile";
import { EmptyState, ErrorState } from "@/components/design-system/empty-state";
import { ChartCard } from "@/components/design-system/chart-card";
import { EntriesTrendChart } from "@/components/design-system/charts/entries-trend-chart";
import { PassStatusChart } from "@/components/design-system/charts/pass-status-chart";
import { ScansByBuildingChart } from "@/components/design-system/charts/scans-by-building-chart";
import { PeakHoursChart } from "@/components/design-system/charts/peak-hours-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDashboardAnalytics, useDashboardSummary } from "@/hooks/queryHooks/useDashboard";
import { formatCairoDateTime } from "@/lib/dates";

const ANALYTICS_DAY_OPTIONS = [7, 30, 90] as const;

export default function AdminDashboardPage() {
  const t = useTranslations("admin.dashboard");
  const tCommon = useTranslations("common");
  const tPasses = useTranslations("passes");
  const locale = useLocale();
  const [days, setDays] = useState<number>(30);

  const query = useDashboardSummary();
  const analyticsQuery = useDashboardAnalytics(days);

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
        <ErrorState title={tCommon("somethingWrong")} retryLabel={tCommon("retry")} onRetry={() => query.refetch()} />
      </div>
    );
  }

  const summary = query.data;
  const analytics = analyticsQuery.data;
  const tiles: StatTileConfig[] = [
    { key: "entries", label: t("entriesToday"), value: summary.entriesToday, icon: DoorOpen, tone: "default" },
    { key: "denied", label: t("deniedToday"), value: summary.deniedToday, icon: ShieldX, tone: "danger" },
    { key: "active", label: t("activePasses"), value: summary.activePasses, icon: Ticket, tone: "success" },
  ];

  const hasEntriesTrend = analytics?.entriesTrend.some((point) => point.allowed > 0 || point.denied > 0) ?? false;
  const hasPassStatus = analytics?.passStatusBreakdown.some((entry) => entry.count > 0) ?? false;
  const hasScansByBuilding = (analytics?.scansByBuilding.length ?? 0) > 0;
  const hasPeakHours = analytics?.peakHours.some((entry) => entry.count > 0) ?? false;

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

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-foreground">{t("analytics")}</h2>
        <Select value={String(days)} onValueChange={(value) => setDays(Number(value))}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ANALYTICS_DAY_OPTIONS.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {t("lastNDays", { days: option })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title={t("entriesTrend", { days })}
          isLoading={analyticsQuery.isLoading}
          isError={analyticsQuery.isError}
          errorTitle={tCommon("somethingWrong")}
          retryLabel={tCommon("retry")}
          onRetry={() => analyticsQuery.refetch()}
          isEmpty={!hasEntriesTrend}
          emptyTitle={t("noChartData")}
        >
          {analytics && <EntriesTrendChart data={analytics.entriesTrend} locale={locale} />}
        </ChartCard>

        <ChartCard
          title={t("passStatusBreakdown")}
          isLoading={analyticsQuery.isLoading}
          isError={analyticsQuery.isError}
          errorTitle={tCommon("somethingWrong")}
          retryLabel={tCommon("retry")}
          onRetry={() => analyticsQuery.refetch()}
          isEmpty={!hasPassStatus}
          emptyTitle={t("noChartData")}
        >
          {analytics && <PassStatusChart data={analytics.passStatusBreakdown} />}
        </ChartCard>

        <ChartCard
          title={t("scansByBuilding")}
          isLoading={analyticsQuery.isLoading}
          isError={analyticsQuery.isError}
          errorTitle={tCommon("somethingWrong")}
          retryLabel={tCommon("retry")}
          onRetry={() => analyticsQuery.refetch()}
          isEmpty={!hasScansByBuilding}
          emptyTitle={t("noChartData")}
        >
          {analytics && <ScansByBuildingChart data={analytics.scansByBuilding} />}
        </ChartCard>

        <ChartCard
          title={t("peakHours")}
          isLoading={analyticsQuery.isLoading}
          isError={analyticsQuery.isError}
          errorTitle={tCommon("somethingWrong")}
          retryLabel={tCommon("retry")}
          onRetry={() => analyticsQuery.refetch()}
          isEmpty={!hasPeakHours}
          emptyTitle={t("noChartData")}
        >
          {analytics && <PeakHoursChart data={analytics.peakHours} />}
        </ChartCard>
      </div>
    </div>
  );
}
