"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/design-system/form-field";
import { buildingFormSchema, type BuildingFormInput } from "@/lib/validation/building";
import type { Building } from "@/types/api";

export function BuildingFormDialog({
  open,
  onOpenChange,
  building,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  building: Building | null;
  onSubmit: (data: BuildingFormInput) => void;
  isPending: boolean;
}) {
  const t = useTranslations("admin.buildings");
  const tCommon = useTranslations("common");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BuildingFormInput>({
    resolver: zodResolver(buildingFormSchema),
    defaultValues: { name: building?.name ?? "" },
  });

  useEffect(() => {
    if (open) reset({ name: building?.name ?? "" });
  }, [open, building, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{building ? t("title") : t("new")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label={t("name")} htmlFor="name" required error={errors.name?.message && tCommon("required")}>
            <Input id="name" placeholder={t("namePlaceholder")} {...register("name")} />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {tCommon("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
