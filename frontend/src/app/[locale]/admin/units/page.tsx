"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { PageHeader } from "@/components/design-system/page-header";
import { DataTable, type DataTableColumn } from "@/components/design-system/data-table";
import { FilterBar } from "@/components/design-system/filter-bar";
import { ConfirmDialog } from "@/components/design-system/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { UnitFormDialog } from "./unit-form-dialog";
import { buildingsApi, unitsApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/query/keys";
import { isApiError, apiErrorMessages } from "@/lib/api/error";
import type { Unit } from "@/types/api";
import type { UnitFormOutput } from "@/lib/validation/unit";

export default function AdminUnitsPage() {
  const t = useTranslations("admin.units");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [buildingId, setBuildingId] = useState<string | undefined>(undefined);
  const [formTarget, setFormTarget] = useState<Unit | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Unit | null>(null);

  const buildingsQuery = useQuery({
    queryKey: queryKeys.buildings.list({ perPage: 100 }),
    queryFn: () => buildingsApi.list({ perPage: 100 }),
  });
  const buildings = buildingsQuery.data?.data ?? [];

  const query = useQuery({
    queryKey: queryKeys.units.list({ page, buildingId }),
    queryFn: () => unitsApi.list({ page, buildingId }),
  });

  function handleMutationError(error: unknown) {
    toast.error(isApiError(error) ? apiErrorMessages(error)[0] ?? tCommon("somethingWrong") : tCommon("somethingWrong"));
  }

  const createMutation = useMutation({
    mutationFn: unitsApi.create,
    onSuccess: () => {
      toast.success(t("createSuccess"));
      queryClient.invalidateQueries({ queryKey: queryKeys.units.all });
      setFormTarget(null);
    },
    onError: handleMutationError,
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; data: Partial<UnitFormOutput> }) => unitsApi.update(vars.id, vars.data),
    onSuccess: () => {
      toast.success(t("updateSuccess"));
      queryClient.invalidateQueries({ queryKey: queryKeys.units.all });
      setFormTarget(null);
    },
    onError: handleMutationError,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => unitsApi.remove(id),
    onSuccess: () => {
      toast.success(t("deleteSuccess"));
      queryClient.invalidateQueries({ queryKey: queryKeys.units.all });
      setDeleteTarget(null);
    },
    onError: handleMutationError,
  });

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
            updateMutation.mutate({ id: formTarget.id, data: { number: data.number, floor: data.floor } });
          } else {
            createMutation.mutate(data);
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDesc")}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
