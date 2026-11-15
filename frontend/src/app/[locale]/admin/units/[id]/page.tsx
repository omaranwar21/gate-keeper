"use client";

import { use, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, UserPlus, UserMinus } from "lucide-react";
import { PageHeader } from "@/components/design-system/page-header";
import { EmptyState, ErrorState } from "@/components/design-system/empty-state";
import { ConfirmDialog } from "@/components/design-system/confirm-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { AssignResidentDialog } from "./assign-resident-dialog";
import { useUnitDetail, useAssignResident, useUnassignResident } from "@/hooks/queryHooks/useUnits";
import type { User } from "@/types/api";

export default function AdminUnitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations("admin.units");
  const tCommon = useTranslations("common");

  const [assignOpen, setAssignOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<User | null>(null);

  const query = useUnitDetail(id);

  const assignMutation = useAssignResident(id);
  const unassignMutation = useUnassignResident(id);

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full max-w-xl rounded-2xl" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return <ErrorState title={tCommon("somethingWrong")} retryLabel={tCommon("retry")} onRetry={() => query.refetch()} />;
  }

  const unit = query.data;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ms-2">
        <Link href="/admin/units">
          <ArrowLeft className="size-4 rtl:rotate-180" />
          {tCommon("back")}
        </Link>
      </Button>

      <PageHeader title={t("detailTitle", { number: unit.number })} description={unit.building?.name} />

      <div className="max-w-xl space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">{t("residents")}</h2>
          <Button size="sm" variant="outline" onClick={() => setAssignOpen(true)}>
            <UserPlus className="size-4" />
            {t("assignResident")}
          </Button>
        </div>

        {unit.residents.length === 0 ? (
          <EmptyState title={t("noResidentsAssigned")} />
        ) : (
          <ul className="space-y-2">
            {unit.residents.map(({ user }) => (
              <li
                key={user.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="size-8 bg-primary/10">
                    <AvatarFallback className="bg-transparent text-xs font-semibold text-primary">
                      {user.fullName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{user.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setRemoveTarget(user)} aria-label={t("unassign")}>
                  <UserMinus className="size-4 text-muted-foreground" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AssignResidentDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        excludeUserIds={unit.residents.map((r) => r.userId)}
        onAssign={(userId) => assignMutation.mutate(userId, { onSuccess: () => setAssignOpen(false) })}
        isPending={assignMutation.isPending}
      />

      <ConfirmDialog
        open={Boolean(removeTarget)}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title={t("unassign")}
        description={t("unassignConfirm", { name: removeTarget?.fullName ?? "" })}
        onConfirm={() =>
          removeTarget && unassignMutation.mutate(removeTarget.id, { onSuccess: () => setRemoveTarget(null) })
        }
        isPending={unassignMutation.isPending}
      />
    </div>
  );
}
