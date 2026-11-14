import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { buildingsApi, type PaginationQuery } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/query/keys";
import type { BuildingFormInput } from "@/lib/validation/building";
import { toastApiError } from "./shared";

export function useBuildingsList(query: PaginationQuery = {}) {
  return useQuery({
    queryKey: queryKeys.buildings.list(query),
    queryFn: () => buildingsApi.list(query),
  });
}

export function useCreateBuilding() {
  const t = useTranslations("admin.buildings");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: buildingsApi.create,
    onSuccess: () => {
      toast.success(t("createSuccess"));
      queryClient.invalidateQueries({ queryKey: queryKeys.buildings.all });
    },
    onError: (error) => toastApiError(error, tCommon("somethingWrong")),
  });
}

export function useUpdateBuilding() {
  const t = useTranslations("admin.buildings");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { id: string; data: BuildingFormInput }) => buildingsApi.update(vars.id, vars.data),
    onSuccess: () => {
      toast.success(t("updateSuccess"));
      queryClient.invalidateQueries({ queryKey: queryKeys.buildings.all });
    },
    onError: (error) => toastApiError(error, tCommon("somethingWrong")),
  });
}

export function useDeleteBuilding() {
  const t = useTranslations("admin.buildings");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => buildingsApi.remove(id),
    onSuccess: () => {
      toast.success(t("deleteSuccess"));
      queryClient.invalidateQueries({ queryKey: queryKeys.buildings.all });
    },
    onError: (error) => toastApiError(error, tCommon("somethingWrong")),
  });
}
