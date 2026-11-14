import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

export default async function GuardIndexPage() {
  const locale = await getLocale();
  redirect({ href: "/guard/scan", locale });
}
