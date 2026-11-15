import { useTranslations } from "next-intl";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScanResponse } from "@/types/api";

export function ScanResultPanel({ response }: { response: ScanResponse }) {
  const t = useTranslations("guard");
  const tCommon = useTranslations("common");
  const allowed = response.result === "allowed";

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-3xl px-6 py-10 text-center shadow-[0_20px_50px_-20px_rgba(15,28,48,0.45)]",
        allowed ? "bg-allow text-allow-foreground" : "bg-deny text-deny-foreground",
      )}
    >
      {allowed ? <CheckCircle2 className="size-16" strokeWidth={1.5} /> : <XCircle className="size-16" strokeWidth={1.5} />}
      <p className="text-4xl font-bold tracking-tight">{allowed ? t("allowed") : t("denied")}</p>

      {!allowed && response.reason && (
        <p className="text-base font-medium opacity-95">{t(`reasons.${response.reason}`)}</p>
      )}

      {response.guestName && (
        <div className="mt-2 w-full max-w-xs space-y-1 rounded-2xl bg-black/10 px-4 py-3 text-start">
          <Detail label={t("guestLabel")} value={response.guestName} />
          {response.unit && (
            <>
              <Detail label={tCommon("building")} value={response.unit.building.name} />
              <Detail label={t("unitLabel")} value={response.unit.number} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="opacity-80">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
