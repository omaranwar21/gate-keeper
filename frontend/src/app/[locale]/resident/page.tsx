import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

export default async function ResidentIndexPage() {
  const locale = await getLocale();
  redirect({ href: "/resident/passes", locale });
}
