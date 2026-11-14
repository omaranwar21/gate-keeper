"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/design-system/page-header";
import { Button } from "@/components/ui/button";
import { CameraScanner } from "./camera-scanner";
import { ScanResultPanel } from "./scan-result-panel";
import { passesApi } from "@/lib/api/endpoints";
import { extractTokenFromInput } from "@/lib/pass-link";
import { formatCairoDateTime } from "@/lib/dates";
import { useGuardScanStore } from "@/store/guard-scan-store";
import { scanResultTone } from "@/lib/status";

export default function GuardScanPage() {
  const t = useTranslations("guard");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const history = useGuardScanStore((state) => state.history);
  const pushScan = useGuardScanStore((state) => state.pushScan);

  const mutation = useMutation({
    mutationFn: (token: string) => passesApi.scan(token),
    onSuccess: (response) => pushScan(response),
    onError: () => toast.error(t("cameraError")),
  });

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) mutation.mutate(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="mx-auto max-w-sm space-y-6">
        {mutation.data ? (
          <div className="space-y-4">
            <ScanResultPanel response={mutation.data} />
            <Button
              className="w-full"
              size="lg"
              onClick={() => mutation.reset()}
            >
              <RotateCcw className="size-4" />
              {t("scanAnother")}
            </Button>
          </div>
        ) : (
          <CameraScanner
            onScan={(token) => {
              const actualToken = extractTokenFromInput(token);
              mutation.mutate(actualToken);
            }}
            disabled={mutation.isPending}
          />
        )}

        {history.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground">
              {t("recentScans")}
            </h2>
            <ul className="space-y-1.5">
              {history.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2 text-sm"
                >
                  <span
                    className={
                      scanResultTone(entry.response.result) === "success"
                        ? "size-2 shrink-0 rounded-full bg-success"
                        : "size-2 shrink-0 rounded-full bg-danger"
                    }
                  />
                  <span className="flex-1 truncate text-foreground">
                    {entry.response.guestName ?? "—"}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatCairoDateTime(
                      new Date(entry.scannedAt).toISOString(),
                      locale,
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
