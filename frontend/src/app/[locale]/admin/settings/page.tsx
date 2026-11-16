"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/design-system/page-header";
import { FormField } from "@/components/design-system/form-field";
import { ErrorState } from "@/components/design-system/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings, useUpdateSettings } from "@/hooks/queryHooks/useSettings";
import type { CompoundSettings } from "@/lib/api/endpoints";
import {
  compoundSettingsFormSchema,
  type CompoundSettingsFormInput,
  type CompoundSettingsFormOutput,
} from "@/lib/validation/settings";

export default function AdminSettingsPage() {
  const t = useTranslations("admin.settings");
  const tCommon = useTranslations("common");

  const query = useSettings();

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("title")} description={t("subtitle")} />
        <Skeleton className="h-44 w-full max-w-xl rounded-2xl" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("title")} description={t("subtitle")} />
        <ErrorState title={tCommon("somethingWrong")} retryLabel={tCommon("retry")} onRetry={() => query.refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <SettingsForm settings={query.data} />
    </div>
  );
}

function SettingsForm({ settings }: { settings: CompoundSettings }) {
  const t = useTranslations("admin.settings");
  const tCommon = useTranslations("common");
  const updateMutation = useUpdateSettings();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompoundSettingsFormInput, unknown, CompoundSettingsFormOutput>({
    resolver: zodResolver(compoundSettingsFormSchema),
    defaultValues: {
      maxActivePassesPerUnitPerDay: settings.maxActivePassesPerUnitPerDay ?? "",
    },
  });

  function onSubmit(data: CompoundSettingsFormOutput) {
    updateMutation.mutate(data);
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-xl space-y-5 rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(15,28,48,0.04),0_12px_32px_-20px_rgba(15,28,48,0.35)]"
    >
      <FormField
        label={t("maxActivePassesPerUnitPerDay")}
        htmlFor="maxActivePassesPerUnitPerDay"
        hint={!errors.maxActivePassesPerUnitPerDay && t("maxActivePassesHint")}
        error={errors.maxActivePassesPerUnitPerDay && t("invalidLimit")}
      >
        <Input
          id="maxActivePassesPerUnitPerDay"
          type="number"
          min={1}
          inputMode="numeric"
          placeholder={t("unlimitedPlaceholder")}
          className="max-w-40"
          {...register("maxActivePassesPerUnitPerDay")}
        />
      </FormField>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isSubmitting || updateMutation.isPending}>
          {tCommon("save")}
        </Button>
      </div>
    </form>
  );
}
