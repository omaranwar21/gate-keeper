"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField } from "@/components/design-system/form-field";
import { unitFormSchema, type UnitFormInput, type UnitFormOutput } from "@/lib/validation/unit";
import type { Building, Unit } from "@/types/api";

export function UnitFormDialog({
  open,
  onOpenChange,
  unit,
  buildings,
  defaultBuildingId,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit: Unit | null;
  buildings: Building[];
  defaultBuildingId?: string;
  onSubmit: (data: UnitFormOutput) => void;
  isPending: boolean;
}) {
  const t = useTranslations("admin.units");
  const tCommon = useTranslations("common");

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UnitFormInput, unknown, UnitFormOutput>({
    resolver: zodResolver(unitFormSchema),
    defaultValues: {
      buildingId: unit?.buildingId ?? defaultBuildingId ?? "",
      number: unit?.number ?? "",
      floor: unit?.floor?.toString() ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        buildingId: unit?.buildingId ?? defaultBuildingId ?? "",
        number: unit?.number ?? "",
        floor: unit?.floor?.toString() ?? "",
      });
    }
  }, [open, unit, defaultBuildingId, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{unit ? t("detailTitle", { number: unit.number }) : t("new")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label={t("building")} required error={errors.buildingId?.message && tCommon("required")}>
            <Controller
              control={control}
              name="buildingId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("selectBuilding")} />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map((building) => (
                      <SelectItem key={building.id} value={building.id}>
                        {building.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <FormField label={t("number")} htmlFor="number" required error={errors.number?.message && tCommon("required")}>
            <Input id="number" placeholder={t("numberPlaceholder")} {...register("number")} />
          </FormField>

          <FormField label={t("floor")} htmlFor="floor">
            <Input id="floor" type="number" {...register("floor")} />
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
