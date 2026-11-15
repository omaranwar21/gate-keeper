import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { passesApi, type ListMyPassesQuery } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/query/keys";
import { useGuardScanStore } from "@/store/guard-scan-store";
import { toastApiError } from "./shared";

export function usePassesMine(query: ListMyPassesQuery) {
  return useQuery({
    queryKey: queryKeys.passes.mine(query),
    queryFn: () => passesApi.listMine(query),
  });
}

export function usePassDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.passes.detail(id),
    queryFn: () => passesApi.getOne(id),
  });
}

export function useCreatePass() {
  const t = useTranslations("passes");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: passesApi.create,
    onSuccess: (response) => {
      // Backend's createSuccess has no guest-name interpolation, so keep the
      // frontend-rendered, personalized toast instead of response.message.
      toast.success(t("createSuccess", { guestName: response.data.guestName }));
      queryClient.invalidateQueries({ queryKey: queryKeys.passes.all });
    },
    onError: (error) => toastApiError(error, tCommon("somethingWrong")),
  });
}

export function useRevokePass() {
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => passesApi.revoke(id),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: queryKeys.passes.all });
    },
    onError: (error) => toastApiError(error, tCommon("somethingWrong")),
  });
}

export function useDeletePass() {
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => passesApi.remove(id),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: queryKeys.passes.all });
    },
    onError: (error) => toastApiError(error, tCommon("somethingWrong")),
  });
}

export function useScanPass() {
  const t = useTranslations("guard");
  const pushScan = useGuardScanStore((state) => state.pushScan);

  return useMutation({
    mutationFn: (token: string) => passesApi.scan(token),
    onSuccess: (response) => pushScan(response),
    onError: () => toast.error(t("cameraError")),
  });
}
