"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PendingBackendState } from "@/components/design-system/empty-state";
import { FormField } from "@/components/design-system/form-field";
import { usersApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/query/keys";

export function AssignResidentDialog({
  open,
  onOpenChange,
  excludeUserIds,
  onAssign,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  excludeUserIds: string[];
  onAssign: (userId: string) => void;
  isPending: boolean;
}) {
  const t = useTranslations("admin.units");
  const tCommon = useTranslations("common");
  const [selected, setSelected] = useState<string>("");

  const query = useQuery({
    queryKey: queryKeys.users.list({ role: "resident" }),
    queryFn: () => usersApi.list({ role: "resident", perPage: 100 }),
    enabled: open,
    retry: false,
  });

  const residents = (query.data?.data ?? []).filter((user) => !excludeUserIds.includes(user.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("assignResident")}</DialogTitle>
        </DialogHeader>

        {query.isLoading ? (
          <Skeleton className="h-9 w-full" />
        ) : query.isError ? (
          <PendingBackendState title={tCommon("somethingWrong")} description={t("noResidentEndpoint")} />
        ) : (
          <FormField label={t("selectResident")}>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("selectResident")} />
              </SelectTrigger>
              <SelectContent>
                {residents.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.fullName} · {user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            disabled={!selected || isPending || query.isError}
            onClick={() => selected && onAssign(selected)}
          >
            {tCommon("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
