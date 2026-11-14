"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/design-system/page-header";
import { DataTable, type DataTableColumn } from "@/components/design-system/data-table";
import { FilterBar, type FilterConfig } from "@/components/design-system/filter-bar";
import { StatusBadge } from "@/components/design-system/status-badge";
import { PendingBackendState } from "@/components/design-system/empty-state";
import { accessLogApi, buildingsApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/query/keys";
import { scanResultTone } from "@/lib/status";
import { formatCairoDateTime } from "@/lib/dates";
import type { AccessLog, ScanResult } from "@/types/api";

export default function AdminAccessLogPage() {
  const t = useTranslations("admin.accessLog");
  const tGuard = useTranslations("guard");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [page, setPage] = useState(1);
  const [date, setDate] = useState<string>();
  const [buildingId, setBuildingId] = useState<string>();
  const [result, setResult] = useState<string>();

  const buildingsQuery = useQuery({
    queryKey: queryKeys.buildings.list({ perPage: 100 }),
    queryFn: () => buildingsApi.list({ perPage: 100 }),
  });

  const query = useQuery({
    queryKey: queryKeys.accessLog.list({ page, date, buildingId, result }),
    queryFn: () =>
      accessLogApi.list({ page, date, buildingId, result: result as ScanResult | undefined }),
    retry: false,
  });

  const filters: FilterConfig[] = [
    { key: "date", type: "date" },
    {
      key: "buildingId",
      type: "select",
      label: tCommon("building"),
      options: (buildingsQuery.data?.data ?? []).map((b) => ({ value: b.id, label: b.name })),
    },
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
    if (key === "date") setDate(value);
    if (key === "buildingId") setBuildingId(value);
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

      <FilterBar filters={filters} values={{ date, buildingId, result }} onChange={handleFilterChange} />

      {query.isError ? (
        <PendingBackendState title={t("title")} description={t("pendingEndpoint")} />
      ) : (
        <DataTable
          columns={columns}
          data={query.data?.data}
          rowKey={(log) => log.id}
          isLoading={query.isLoading}
          errorTitle={tCommon("somethingWrong")}
          meta={query.data?.meta}
          onPageChange={setPage}
          emptyTitle={t("empty")}
        />
      )}
    </div>
  );
}
