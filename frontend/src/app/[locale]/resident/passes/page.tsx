"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, QrCode, Ban, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/design-system/page-header";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/design-system/data-table";
import {
  FilterBar,
  type FilterConfig,
} from "@/components/design-system/filter-bar";
import { StatusBadge } from "@/components/design-system/status-badge";
import { ConfirmDialog } from "@/components/design-system/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { usePassesMine, useRevokePass, useDeletePass } from "@/hooks/queryHooks/usePasses";
import { passStatusTone } from "@/lib/status";
import { passWindowSummary } from "@/lib/pass-summary";
import type { GuestPass, PassStatus } from "@/types/api";

export default function ResidentPassesPage() {
  const t = useTranslations("passes");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>();
  const [today, setToday] = useState<string>();
  const [revokeTarget, setRevokeTarget] = useState<GuestPass | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GuestPass | null>(null);

  const dayLabels = [0, 1, 2, 3, 4, 5, 6].map((d) => t(`days.${d}`));

  const query = usePassesMine({
    page,
    status: status as PassStatus | undefined,
    today: today === "true" ? true : undefined,
  });

  const filters: FilterConfig[] = [
    {
      key: "status",
      type: "select",
      label: tCommon("status"),
      options: (["active", "used", "expired", "revoked"] as PassStatus[]).map(
        (value) => ({
          value,
          label: t(`status.${value}`),
        }),
      ),
    },
    {
      key: "today",
      type: "select",
      label: tCommon("today"),
      options: [{ value: "true", label: tCommon("today") }],
    },
  ];

  function handleFilterChange(key: string, value: string | undefined) {
    setPage(1);
    if (key === "status") setStatus(value);
    if (key === "today") setToday(value);
  }

  const revokeMutation = useRevokePass();
  const deleteMutation = useDeletePass();

  const columns: DataTableColumn<GuestPass>[] = [
    {
      key: "guestName",
      header: t("guestName"),
      cell: (pass) => (
        <Link
          href={`/resident/passes/${pass.id}`}
          className="font-medium text-foreground hover:underline"
        >
          {pass.guestName}
        </Link>
      ),
    },
    {
      key: "unit",
      header: tCommon("unit"),
      cell: (pass) =>
        pass.unit ? `${pass.unit.building?.name ?? ""} · ${pass.unit.number}` : "—",
    },
    {
      key: "type",
      header: t("type"),
      cell: (pass) =>
        pass.type === "one_time" ? t("oneTime") : t("recurring"),
    },
    {
      key: "window",
      header: t("validFrom"),
      cell: (pass) => (
        <span className="text-sm text-muted-foreground">
          {passWindowSummary(pass, locale, dayLabels)}
        </span>
      ),
    },
    {
      key: "status",
      header: tCommon("status"),
      cell: (pass) => (
        <StatusBadge tone={passStatusTone(pass.status as PassStatus)}>
          {t(`status.${pass.status}`)}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      header: tCommon("actions"),
      headerClassName: "text-end",
      className: "text-end",
      cell: (pass) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" asChild>
            <Link
              href={`/resident/passes/${pass.id}`}
              aria-label={t("qrTitle")}
            >
              <QrCode className="size-4" />
            </Link>
          </Button>
          {pass.status === "active" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRevokeTarget(pass)}
              aria-label={t("revoke")}
            >
              <Ban className="size-4 text-danger" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteTarget(pass)}
            aria-label={tCommon("delete")}
          >
            <Trash2 className="size-4 text-muted-foreground" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button asChild>
            <Link href="/resident/passes/new">
              <Plus className="size-4" />
              {t("newPass")}
            </Link>
          </Button>
        }
      />

      <FilterBar
        filters={filters}
        values={{ status, today }}
        onChange={handleFilterChange}
      />

      <DataTable
        columns={columns}
        data={query.data?.data}
        rowKey={(pass) => pass.id}
        isLoading={query.isLoading}
        isError={query.isError}
        onRetry={() => query.refetch()}
        errorTitle={tCommon("somethingWrong")}
        meta={query.data?.meta}
        onPageChange={setPage}
        emptyTitle={t("empty")}
        emptyDescription={t("emptyDesc")}
        emptyAction={
          <Button asChild size="sm">
            <Link href="/resident/passes/new">{t("newPass")}</Link>
          </Button>
        }
      />

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
        title={t("revokeConfirmTitle")}
        description={t("revokeConfirmDesc", {
          guestName: revokeTarget?.guestName ?? "",
        })}
        onConfirm={() =>
          revokeTarget && revokeMutation.mutate(revokeTarget.id, { onSuccess: () => setRevokeTarget(null) })
        }
        isPending={revokeMutation.isPending}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDesc")}
        onConfirm={() =>
          deleteTarget && deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })
        }
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
