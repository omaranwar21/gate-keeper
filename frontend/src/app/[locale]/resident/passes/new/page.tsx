"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/design-system/page-header";
import { FormField } from "@/components/design-system/form-field";
import { DayOfWeekPicker } from "@/components/design-system/day-of-week-picker";
import { EmptyState } from "@/components/design-system/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "@/i18n/navigation";
import { useMyUnitsList } from "@/hooks/queryHooks/useUnits";
import { useCreatePass } from "@/hooks/queryHooks/usePasses";
import { cairoDateTimeToIso, timeStringToMinutes, todayInCairo } from "@/lib/dates";
import { guestPassFormSchema, type GuestPassFormInput } from "@/lib/validation/guest-pass";

export default function NewGuestPassPage() {
  const t = useTranslations("passes");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const unitsQuery = useMyUnitsList({ perPage: 50 });

  const today = todayInCairo();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<GuestPassFormInput>({
    resolver: zodResolver(guestPassFormSchema),
    defaultValues: {
      type: "one_time",
      unitId: "",
      guestName: "",
      visitDate: today,
      startTime: "09:00",
      endTime: "17:00",
      daysOfWeek: [],
      startDate: today,
      untilDate: today,
      dailyStartTime: "08:00",
      dailyEndTime: "17:00",
    } as unknown as GuestPassFormInput,
  });

  const type = watch("type");
  const units = unitsQuery.data?.data ?? [];

  useEffect(() => {
    if (units.length === 1 && !watch("unitId")) {
      setValue("unitId", units[0].unit.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units.length]);

  const createMutation = useCreatePass();

  function onSubmit(data: GuestPassFormInput) {
    const redirectOnSuccess = {
      onSuccess: (pass: { id: string }) => router.push(`/resident/passes/${pass.id}`),
    };
    if (data.type === "one_time") {
      createMutation.mutate(
        {
          unitId: data.unitId,
          guestName: data.guestName,
          type: "one_time",
          validFrom: cairoDateTimeToIso(data.visitDate, data.startTime),
          validUntil: cairoDateTimeToIso(data.visitDate, data.endTime),
        },
        redirectOnSuccess,
      );
    } else {
      if (data.daysOfWeek.length === 0) {
        setError("daysOfWeek", { message: "required" });
        return;
      }
      createMutation.mutate(
        {
          unitId: data.unitId,
          guestName: data.guestName,
          type: "recurring",
          validFrom: cairoDateTimeToIso(data.startDate, "00:00"),
          validUntil: cairoDateTimeToIso(data.untilDate, "23:59"),
          daysOfWeek: data.daysOfWeek,
          dailyStartMin: timeStringToMinutes(data.dailyStartTime),
          dailyEndMin: timeStringToMinutes(data.dailyEndTime),
        },
        redirectOnSuccess,
      );
    }
  }

  if (unitsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("createTitle")} />
        <Skeleton className="h-96 w-full max-w-xl rounded-2xl" />
      </div>
    );
  }

  if (units.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("createTitle")} />
        <EmptyState title={t("noUnits")} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("createTitle")} />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-xl space-y-5 rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(15,28,48,0.04),0_12px_32px_-20px_rgba(15,28,48,0.35)]"
      >
        {units.length > 1 && (
          <FormField label={t("unit")} required error={errors.unitId?.message}>
            <Controller
              control={control}
              name="unitId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("selectUnit")} />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(({ unit }) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.building?.name} · {unit.number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
        )}

        <FormField label={t("guestName")} htmlFor="guestName" required error={errors.guestName?.message && tCommon("required")}>
          <Input id="guestName" placeholder={t("guestNamePlaceholder")} {...register("guestName")} />
        </FormField>

        <FormField label={t("type")}>
          <Tabs value={type} onValueChange={(value) => setValue("type", value as "one_time" | "recurring")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="one_time">{t("oneTime")}</TabsTrigger>
              <TabsTrigger value="recurring">{t("recurring")}</TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {type === "one_time" ? t("oneTimeHint") : t("recurringHint")}
          </p>
        </FormField>

        {type === "one_time" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label={tCommon("date")} htmlFor="visitDate" required>
              <Input id="visitDate" type="date" min={today} {...register("visitDate")} />
            </FormField>
            <FormField
              label={t("validFrom")}
              htmlFor="startTime"
              required
              error={type === "one_time" && "endTime" in errors ? t("windowInvalid") : undefined}
            >
              <Input id="startTime" type="time" {...register("startTime")} />
            </FormField>
            <FormField label={t("validUntil")} htmlFor="endTime" required>
              <Input id="endTime" type="time" {...register("endTime")} />
            </FormField>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label={t("validFrom")} htmlFor="startDate" required>
                <Input id="startDate" type="date" min={today} {...register("startDate")} />
              </FormField>
              <FormField
                label={t("validUntil")}
                htmlFor="untilDate"
                required
                error={"untilDate" in errors ? t("windowInvalid") : undefined}
              >
                <Input id="untilDate" type="date" min={today} {...register("untilDate")} />
              </FormField>
            </div>

            <FormField label={t("daysOfWeek")} required error={"daysOfWeek" in errors ? t("pickDays") : undefined}>
              <Controller
                control={control}
                name="daysOfWeek"
                render={({ field }) => <DayOfWeekPicker value={field.value} onChange={field.onChange} />}
              />
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label={t("dailyStart")} htmlFor="dailyStartTime" required>
                <Input id="dailyStartTime" type="time" {...register("dailyStartTime")} />
              </FormField>
              <FormField
                label={t("dailyEnd")}
                htmlFor="dailyEndTime"
                required
                error={"dailyEndTime" in errors ? t("dailyWindowInvalid") : undefined}
              >
                <Input id="dailyEndTime" type="time" {...register("dailyEndTime")} />
              </FormField>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {tCommon("cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
            {t("newPass")}
          </Button>
        </div>
      </form>
    </div>
  );
}
