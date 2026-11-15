"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { X } from "lucide-react";
import { PageHeader } from "@/components/design-system/page-header";
import { DataTable, type DataTableColumn } from "@/components/design-system/data-table";
import { FilterBar, type FilterConfig } from "@/components/design-system/filter-bar";
import { DateRangePicker } from "@/components/design-system/date-range-picker";
import { TimePicker } from "@/components/design-system/time-picker";
import { StatusBadge } from "@/components/design-system/status-badge";
import { Button } from "@/components/ui/button";
import { useAccessLogList } from "@/hooks/queryHooks/useAccessLog";
import { useBuildingsList } from "@/hooks/queryHooks/useBuildings";
import { useUnitsList } from "@/hooks/queryHooks/useUnits";
import { scanResultTone } from "@/lib/status";
import { cairoDateTimeToIso, formatCairoDateTime } from "@/lib/dates";
import type { AccessLog, ScanResult } from "@/types/api";

export default function AdminAccessLogPage() {
  const t = useTranslations("admin.accessLog");
  const tGuard = useTranslations("guard");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState<string>();
  const [toDate, setToDate] = useState<string>();
  const [fromTime, setFromTime] = useState<string>();
  const [toTime, setToTime] = useState<string>();
  const [buildingId, setBuildingId] = useState<string>();
  const [unitId, setUnitId] = useState<string>();
  const [result, setResult] = useState<string>();

  const buildingsQuery = useBuildingsList({ perPage: 100 });
  const unitsQuery = useUnitsList({ buildingId, perPage: 100 });

  const from = fromDate ? cairoDateTimeToIso(fromDate, fromTime || "00:00") : undefined;
  const to = toDate ? cairoDateTimeToIso(toDate, toTime || "23:59") : undefined;
  const hasPeriod = Boolean(fromDate || toDate || fromTime || toTime);

  const query = useAccessLogList({ page, from, to, buildingId, unitId, result: result as ScanResult | undefined });

  function clearPeriod() {
    setPage(1);
    setFromDate(undefined);
    setToDate(undefined);
    setFromTime(undefined);
    setToTime(undefined);
  }

  const filters: FilterConfig[] = [
    {
      key: "buildingId",
      type: "select",
      label: tCommon("building"),
      options: (buildingsQuery.data?.data ?? []).map((b) => ({ value: b.id, label: b.name })),
    },
    ...(buildingId
      ? [
          {
            key: "unitId",
            type: "select" as const,
            label: tCommon("unit"),
            options: (unitsQuery.data?.data ?? []).map((u) => ({ value: u.id, label: u.number })),
          },
        ]
      : []),
    {
      key: "result",
      type: "select",
      label: tCommon("status"),
      options: [
        { value: "allowed", label: t("result.allowed") },
        { value: "denied", label: t("result.denied") },
      ],
    },
  ];

  function handleFilterChange(key: string, value: string | undefined) {
    setPage(1);
    if (key === "buildingId") {
      setBuildingId(value);
      setUnitId(undefined);
    }
    if (key === "unitId") setUnitId(value);
    if (key === "result") setResult(value);
  }

  const columns: DataTableColumn<AccessLog>[] = [
    {
      key: "scannedAt",
      header: t("scannedAt"),
      cell: (log) => <span className="text-sm">{formatCairoDateTime(log.scannedAt, locale)}</span>,
    },
    { key: "guestName", header: tGuard("guestLabel"), cell: (log) => log.guestName ?? log.pass?.guestName ?? "—" },
    {
      key: "unit",
      header: tCommon("unit"),
      cell: (log) => (log.unit ? `${log.unit.building?.name ?? ""} · ${log.unit.number}` : "—"),
    },
    {
      key: "result",
      header: tCommon("status"),
      cell: (log) => (
        <StatusBadge tone={scanResultTone(log.result)}>{t(`result.${log.result}`)}</StatusBadge>
      ),
    },
    { key: "reason", header: t("reason"), cell: (log) => (log.reason ? tGuard(`reasons.${log.reason}`) : "—") },
    { key: "guard", header: t("guard"), cell: (log) => log.guard?.fullName ?? "—" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">{tCommon("date")}</label>
          <DateRangePicker
            className="w-64"
            from={fromDate}
            to={toDate}
            placeholder={tCommon("date")}
            onChange={(range) => {
              setPage(1);
              setFromDate(range.from);
              setToDate(range.to);
            }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">{tCommon("from")}</label>
          <TimePicker
            className="w-28"
            disabled={!fromDate}
            value={fromTime}
            placeholder={tCommon("time")}
            onChange={(value) => {
              setPage(1);
              setFromTime(value);
            }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">{tCommon("to")}</label>
          <TimePicker
            className="w-28"
            disabled={!toDate}
            value={toTime}
            placeholder={tCommon("time")}
            onChange={(value) => {
              setPage(1);
              setToTime(value);
            }}
          />
        </div>
        {hasPeriod && (
          <Button variant="ghost" size="sm" onClick={clearPeriod}>
            <X className="size-3.5" />
            {tCommon("clear")}
          </Button>
        )}
      </div>

      <FilterBar filters={filters} values={{ buildingId, unitId, result }} onChange={handleFilterChange} />

      <DataTable
        columns={columns}
        data={query.data?.data}
        rowKey={(log) => log.id}
        isLoading={query.isLoading}
        isError={query.isError}
        onRetry={() => query.refetch()}
        errorTitle={tCommon("somethingWrong")}
        meta={query.data?.meta}
        onPageChange={setPage}
        emptyTitle={t("empty")}
      />
    </div>
  );
}
