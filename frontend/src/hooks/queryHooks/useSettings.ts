import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { settingsApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/query/keys";
import { toastApiError } from "./shared";

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings.detail,
    queryFn: settingsApi.get,
  });
}

export function useUpdateSettings() {
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { maxActivePassesPerUnitPerDay: number | null }) => settingsApi.update(data),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.detail });
    },
    onError: (error) => toastApiError(error, tCommon("somethingWrong")),
  });
}
