"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/design-system/page-header";
import { DataTable, type DataTableColumn } from "@/components/design-system/data-table";
import { ConfirmDialog } from "@/components/design-system/confirm-dialog";
import { Button } from "@/components/ui/button";
import { BuildingFormDialog } from "./building-form-dialog";
import { buildingsApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/query/keys";
import { isApiError, apiErrorMessages } from "@/lib/api/error";
import type { Building } from "@/types/api";
import type { BuildingFormInput } from "@/lib/validation/building";

export default function AdminBuildingsPage() {
  const t = useTranslations("admin.buildings");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [formTarget, setFormTarget] = useState<Building | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Building | null>(null);

  const query = useQuery({
    queryKey: queryKeys.buildings.list({ page }),
    queryFn: () => buildingsApi.list({ page }),
  });

  function handleMutationError(error: unknown) {
    if (isApiError(error)) {
      toast.error(apiErrorMessages(error)[0] ?? tCommon("somethingWrong"));
    } else {
      toast.error(tCommon("somethingWrong"));
    }
  }

  const createMutation = useMutation({
    mutationFn: buildingsApi.create,
    onSuccess: () => {
      toast.success(t("createSuccess"));
      queryClient.invalidateQueries({ queryKey: queryKeys.buildings.all });
      setFormTarget(null);
    },
    onError: handleMutationError,
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; data: BuildingFormInput }) => buildingsApi.update(vars.id, vars.data),
    onSuccess: () => {
      toast.success(t("updateSuccess"));
      queryClient.invalidateQueries({ queryKey: queryKeys.buildings.all });
      setFormTarget(null);
    },
    onError: handleMutationError,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => buildingsApi.remove(id),
    onSuccess: () => {
      toast.success(t("deleteSuccess"));
      queryClient.invalidateQueries({ queryKey: queryKeys.buildings.all });
      setDeleteTarget(null);
    },
    onError: handleMutationError,
  });

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
            updateMutation.mutate({ id: formTarget.id, data });
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
