"use client";

import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/design-system/empty-state";
import type { PaginationMeta } from "@/types/api";

export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[] | undefined;
  rowKey: (row: T) => string;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  errorTitle: string;
  errorDescription?: string;
  meta?: PaginationMeta;
  onPageChange?: (page: number) => void;
  emptyTitle: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  skeletonRows?: number;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  isLoading,
  isError,
  onRetry,
  errorTitle,
  errorDescription,
  meta,
  onPageChange,
  emptyTitle,
  emptyDescription,
  emptyAction,
  skeletonRows = 5,
}: DataTableProps<T>) {
  const t = useTranslations("common");

  if (isError) {
    return <ErrorState title={errorTitle} description={errorDescription} onRetry={onRetry} retryLabel={t("retry")} />;
  }

  if (!isLoading && (!data || data.length === 0)) {
    return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }

  const [titleColumn, ...restColumns] = columns;
  const actionsColumn = restColumns.find((column) => column.key === "actions");
  const bodyColumns = restColumns.filter((column) => column.key !== "actions");

  return (
    <div className="space-y-3">
      <div className="hidden overflow-x-auto rounded-2xl border border-border bg-card sm:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((column) => (
                <TableHead key={column.key} className={column.headerClassName}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: skeletonRows }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {columns.map((column) => (
                      <TableCell key={column.key}>
                        <Skeleton className="h-4 w-full max-w-40" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : data?.map((row) => (
                  <TableRow key={rowKey(row)}>
                    {columns.map((column) => (
                      <TableCell key={column.key} className={column.className}>
                        {column.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 sm:hidden">
        {isLoading
          ? Array.from({ length: skeletonRows }).map((_, i) => (
              <div key={`skeleton-card-${i}`} className="space-y-2.5 rounded-2xl border border-border bg-card p-4">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3.5 w-1/2" />
                <Skeleton className="h-3.5 w-1/3" />
              </div>
            ))
          : data?.map((row) => (
              <div key={rowKey(row)} className="space-y-3 rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 text-sm font-medium text-foreground">{titleColumn.cell(row)}</div>
                  {actionsColumn && <div className="shrink-0">{actionsColumn.cell(row)}</div>}
                </div>
                {bodyColumns.length > 0 && (
                  <dl className="space-y-1.5">
                    {bodyColumns.map((column) => (
                      <div key={column.key} className="flex items-center justify-between gap-3 text-sm">
                        <dt className="shrink-0 text-muted-foreground">{column.header}</dt>
                        <dd className="min-w-0 text-end text-foreground">{column.cell(row)}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            ))}
      </div>

      {meta && onPageChange && meta.total > meta.perPage && (
        <div className="flex items-center justify-between gap-4 px-1 text-sm text-muted-foreground">
          <p>
            {t("page")} {meta.currentPage} {t("of")} {meta.lastPage}
            <span className="mx-1.5">·</span>
            {meta.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={!meta.prev}
              onClick={() => meta.prev && onPageChange(meta.prev)}
              aria-label={t("back")}
            >
              <ChevronLeft className="rtl:rotate-180" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={!meta.next}
              onClick={() => meta.next && onPageChange(meta.next)}
              aria-label={t("page")}
            >
              <ChevronRight className="rtl:rotate-180" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
