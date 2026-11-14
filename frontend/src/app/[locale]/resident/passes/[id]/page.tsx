"use client";

import { use, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Ban, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/design-system/page-header";
import { StatusBadge } from "@/components/design-system/status-badge";
import { QrDisplay } from "@/components/design-system/qr-display";
import { ConfirmDialog } from "@/components/design-system/confirm-dialog";
import { ErrorState } from "@/components/design-system/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { passesApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/query/keys";
import { passStatusTone } from "@/lib/status";
import { passWindowSummary } from "@/lib/pass-summary";
import { guestPassLink } from "@/lib/pass-link";
import { formatCairoDateTime } from "@/lib/dates";
import type { PassStatus } from "@/types/api";

export default function GuestPassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations("passes");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const dayLabels = [0, 1, 2, 3, 4, 5, 6].map((d) => t(`days.${d}`));

  const query = useQuery({
    queryKey: queryKeys.passes.detail(id),
    queryFn: () => passesApi.getOne(id),
  });

  const revokeMutation = useMutation({
    mutationFn: () => passesApi.revoke(id),
    onSuccess: () => {
      toast.success(t("revokeSuccess"));
      queryClient.invalidateQueries({ queryKey: queryKeys.passes.all });
      setRevokeOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => passesApi.remove(id),
    onSuccess: () => {
      toast.success(t("deleteSuccess"));
      queryClient.invalidateQueries({ queryKey: queryKeys.passes.all });
      router.push("/resident/passes");
    },
  });

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-80 w-full max-w-xl rounded-2xl" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return <ErrorState title={t("notFound")} retryLabel={tCommon("retry")} onRetry={() => query.refetch()} />;
  }

  const pass = query.data;
  const status = pass.status as PassStatus;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ms-2">
        <Link href="/resident/passes">
          <ArrowLeft className="size-4 rtl:rotate-180" />
          {tCommon("back")}
        </Link>
      </Button>

      <PageHeader
        title={pass.guestName}
        description={pass.unit?.building ? `${pass.unit.building.name} · ${pass.unit.number}` : undefined}
        actions={<StatusBadge tone={passStatusTone(status)}>{t(`status.${status}`)}</StatusBadge>}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <Row label={t("type")} value={pass.type === "one_time" ? t("oneTime") : t("recurring")} />
          <Row label={t("validFrom")} value={passWindowSummary(pass, locale, dayLabels)} />
          {pass.revokedAt && (
            <Row label={t("revoke")} value={t("revokedOn", { date: formatCairoDateTime(pass.revokedAt, locale) })} />
          )}

          {status === "active" && (
            <div className="flex items-center gap-2 pt-2">
              <Button variant="outline" onClick={() => setRevokeOpen(true)}>
                <Ban className="size-4" />
                {t("revoke")}
              </Button>
              <Button variant="ghost" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="size-4" />
                {tCommon("delete")}
              </Button>
            </div>
          )}
          {status !== "active" && (
            <div className="pt-2">
              <Button variant="ghost" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="size-4" />
                {tCommon("delete")}
              </Button>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-medium text-foreground">{t("qrTitle")}</h2>
          <p className="mb-4 text-sm text-muted-foreground">{t("qrDesc", { guestName: pass.guestName })}</p>
          <QrDisplay value={guestPassLink(pass.token, locale)} fileName={`pass-${pass.guestName}`} />
        </div>
      </div>

      <ConfirmDialog
        open={revokeOpen}
        onOpenChange={setRevokeOpen}
        title={t("revokeConfirmTitle")}
        description={t("revokeConfirmDesc", { guestName: pass.guestName })}
        onConfirm={() => revokeMutation.mutate()}
        isPending={revokeMutation.isPending}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDesc")}
        onConfirm={() => deleteMutation.mutate()}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
