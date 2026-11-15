import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/design-system/empty-state";

export function ChartCard({
  title,
  description,
  isLoading,
  isError,
  errorTitle,
  onRetry,
  retryLabel,
  isEmpty,
  emptyTitle,
  children,
}: {
  title: string;
  description?: string;
  isLoading?: boolean;
  isError?: boolean;
  errorTitle?: string;
  onRetry?: () => void;
  retryLabel?: string;
  isEmpty?: boolean;
  emptyTitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="text-sm font-medium text-foreground">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      <div className="mt-4 h-64">
        {isLoading ? (
          <Skeleton className="size-full" />
        ) : isError ? (
          <ErrorState
            className="h-full py-0"
            title={errorTitle ?? ""}
            retryLabel={retryLabel ?? ""}
            onRetry={onRetry}
          />
        ) : isEmpty ? (
          <div className="flex size-full items-center justify-center text-center text-sm text-muted-foreground">
            {emptyTitle}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
