"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/design-system/page-header";
import { DataTable, type DataTableColumn } from "@/components/design-system/data-table";
import { ConfirmDialog } from "@/components/design-system/confirm-dialog";
import { Button } from "@/components/ui/button";
import { BuildingFormDialog } from "./building-form-dialog";
import { useBuildingsList, useCreateBuilding, useUpdateBuilding, useDeleteBuilding } from "@/hooks/queryHooks/useBuildings";
import type { Building } from "@/types/api";

export default function AdminBuildingsPage() {
  const t = useTranslations("admin.buildings");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [page, setPage] = useState(1);
  const [formTarget, setFormTarget] = useState<Building | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Building | null>(null);

  const query = useBuildingsList({ page });

  const createMutation = useCreateBuilding();
  const updateMutation = useUpdateBuilding();
  const deleteMutation = useDeleteBuilding();

  const columns: DataTableColumn<Building>[] = [
    { key: "name", header: t("name"), cell: (b) => <span className="font-medium text-foreground">{b.name}</span> },
    {
      key: "createdAt",
      header: tCommon("date"),
      cell: (b) => (
        <span className="text-sm text-muted-foreground">
          {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(b.createdAt))}
        </span>
      ),
    },
    {
      key: "actions",
      header: tCommon("actions"),
      headerClassName: "text-end",
      className: "text-end",
      cell: (b) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => setFormTarget(b)} aria-label={tCommon("edit")}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(b)} aria-label={tCommon("delete")}>
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
          <Button onClick={() => setFormTarget("new")}>
            <Plus className="size-4" />
            {t("new")}
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={query.data?.data}
        rowKey={(b) => b.id}
        isLoading={query.isLoading}
        isError={query.isError}
        onRetry={() => query.refetch()}
        errorTitle={tCommon("somethingWrong")}
        meta={query.data?.meta}
        onPageChange={setPage}
        emptyTitle={t("empty")}
        emptyDescription={t("emptyDesc")}
        emptyAction={
          <Button size="sm" onClick={() => setFormTarget("new")}>
            {t("new")}
          </Button>
        }
      />

      <BuildingFormDialog
        open={Boolean(formTarget)}
        onOpenChange={(open) => !open && setFormTarget(null)}
        building={formTarget && formTarget !== "new" ? formTarget : null}
        isPending={createMutation.isPending || updateMutation.isPending}
        onSubmit={(data) => {
          if (formTarget && formTarget !== "new") {
            updateMutation.mutate({ id: formTarget.id, data }, { onSuccess: () => setFormTarget(null) });
          } else {
            createMutation.mutate(data, { onSuccess: () => setFormTarget(null) });
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDesc")}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
