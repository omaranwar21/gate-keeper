"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { PageHeader } from "@/components/design-system/page-header";
import { DataTable, type DataTableColumn } from "@/components/design-system/data-table";
import { FilterBar } from "@/components/design-system/filter-bar";
import { ConfirmDialog } from "@/components/design-system/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { UnitFormDialog } from "./unit-form-dialog";
import { useBuildingsList } from "@/hooks/queryHooks/useBuildings";
import { useUnitsList, useCreateUnit, useUpdateUnit, useDeleteUnit } from "@/hooks/queryHooks/useUnits";
import type { Unit } from "@/types/api";

export default function AdminUnitsPage() {
  const t = useTranslations("admin.units");
  const tCommon = useTranslations("common");

  const [page, setPage] = useState(1);
  const [buildingId, setBuildingId] = useState<string | undefined>(undefined);
  const [formTarget, setFormTarget] = useState<Unit | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Unit | null>(null);

  const buildingsQuery = useBuildingsList({ perPage: 100 });
  const buildings = buildingsQuery.data?.data ?? [];

  const query = useUnitsList({ page, buildingId });

  const createMutation = useCreateUnit();
  const updateMutation = useUpdateUnit();
  const deleteMutation = useDeleteUnit();

  const columns: DataTableColumn<Unit>[] = [
    {
      key: "number",
      header: t("number"),
      cell: (unit) => (
        <Link href={`/admin/units/${unit.id}`} className="font-medium text-foreground hover:underline">
          {unit.number}
        </Link>
      ),
    },
    { key: "building", header: t("building"), cell: (unit) => unit.building?.name ?? "—" },
    { key: "floor", header: t("floor"), cell: (unit) => unit.floor ?? "—" },
    {
      key: "actions",
      header: tCommon("actions"),
      headerClassName: "text-end",
      className: "text-end",
      cell: (unit) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" asChild aria-label={t("residents")}>
            <Link href={`/admin/units/${unit.id}`}>
              <Users className="size-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setFormTarget(unit)} aria-label={tCommon("edit")}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(unit)} aria-label={tCommon("delete")}>
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

      <FilterBar
        filters={[
          {
            key: "buildingId",
            type: "select",
            label: t("building"),
            options: buildings.map((b) => ({ value: b.id, label: b.name })),
          },
        ]}
        values={{ buildingId }}
        onChange={(_key, value) => {
          setBuildingId(value);
          setPage(1);
        }}
      />

      <DataTable
        columns={columns}
        data={query.data?.data}
        rowKey={(unit) => unit.id}
        isLoading={query.isLoading}
        isError={query.isError}
        onRetry={() => query.refetch()}
        errorTitle={tCommon("somethingWrong")}
        meta={query.data?.meta}
        onPageChange={setPage}
        emptyTitle={t("empty")}
        emptyDescription={t("emptyDesc")}
      />

      <UnitFormDialog
        open={Boolean(formTarget)}
        onOpenChange={(open) => !open && setFormTarget(null)}
        unit={formTarget && formTarget !== "new" ? formTarget : null}
        buildings={buildings}
        defaultBuildingId={buildingId}
        isPending={createMutation.isPending || updateMutation.isPending}
        onSubmit={(data) => {
          if (formTarget && formTarget !== "new") {
            updateMutation.mutate(
              { id: formTarget.id, data: { number: data.number, floor: data.floor } },
              { onSuccess: () => setFormTarget(null) },
            );
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
