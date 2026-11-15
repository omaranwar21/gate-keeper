"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormField } from "@/components/design-system/form-field";
import { LocaleSwitcher } from "@/components/shell/locale-switcher";
import { isApiError } from "@/lib/api/error";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";
import { useUserLogin } from "@/hooks/queryHooks/useLogin";

export default function LoginPage() {
  const t = useTranslations("auth");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const mutation = useUserLogin();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="absolute top-4 end-4">
        <LocaleSwitcher />
      </div>

      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <ShieldCheck className="size-6" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <form
          className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(15,28,48,0.04),0_12px_32px_-20px_rgba(15,28,48,0.35)]"
          onSubmit={handleSubmit((data) => {
            setServerError(null);
            mutation.mutate(data, {
              onError: (error) => {
                setServerError(isApiError(error) && error.status === 401 ? t("invalidCredentials") : t("genericError"));
              },
            });
          })}
        >
          {serverError && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <FormField label={t("email")} htmlFor="email" error={errors.email && t("emailInvalid")}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={t("emailPlaceholder")}
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
          </FormField>

          <FormField label={t("password")} htmlFor="password" error={errors.password && t("passwordTooShort")}>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              {...register("password")}
            />
          </FormField>

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? t("signingIn") : t("signIn")}
          </Button>
        </form>
      </div>
    </div>
  );
}
