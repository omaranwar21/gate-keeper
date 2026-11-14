import type { LucideIcon } from "lucide-react";
import { Inbox, AlertTriangle, Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Panel({
  icon: Icon,
  tone,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  tone: "neutral" | "danger" | "pending";
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/60 px-6 py-12 text-center",
        className,
      )}
    >
      <div
        className={cn("flex size-11 items-center justify-center rounded-full", {
          "bg-muted text-muted-foreground": tone === "neutral",
          "bg-danger-muted text-danger": tone === "danger",
          "bg-warning-muted text-warning": tone === "pending",
        })}
      >
        <Icon className="size-5" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function EmptyState(props: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  icon?: LucideIcon;
}) {
  return <Panel {...props} icon={props.icon ?? Inbox} tone="neutral" />;
}

export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  onRetry?: () => void;
  retryLabel: string;
  className?: string;
}) {
  return (
    <Panel
      icon={AlertTriangle}
      tone="danger"
      title={title}
      description={description}
      className={className}
      action={
        onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        )
      }
    />
  );
}

export function PendingBackendState({
  title,
  description,
  className,
}: {
  title: React.ReactNode;
  description: React.ReactNode;
  className?: string;
}) {
  return (
    <Panel icon={Construction} tone="pending" title={title} description={description} className={className} />
  );
}
