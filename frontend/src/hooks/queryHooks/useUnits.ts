import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { unitsApi, type CreateUnitInput, type PaginationQuery } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/query/keys";
import type { UnitFormOutput } from "@/lib/validation/unit";
import { toastApiError } from "./shared";

export function useMyUnitsList(query: PaginationQuery = {}) {
  return useQuery({
    queryKey: queryKeys.units.mine(query),
    queryFn: () => unitsApi.listMine(query),
  });
}

export function useUnitsList(query: PaginationQuery & { buildingId?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.units.list(query),
    queryFn: () => unitsApi.list(query),
  });
}

export function useUnitDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.units.detail(id),
    queryFn: () => unitsApi.getOne(id),
  });
}

export function useCreateUnit() {
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUnitInput) => unitsApi.create(data),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: queryKeys.units.all });
    },
    onError: (error) => toastApiError(error, tCommon("somethingWrong")),
  });
}

export function useUpdateUnit() {
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { id: string; data: Partial<UnitFormOutput> }) => unitsApi.update(vars.id, vars.data),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: queryKeys.units.all });
    },
    onError: (error) => toastApiError(error, tCommon("somethingWrong")),
  });
}

export function useDeleteUnit() {
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => unitsApi.remove(id),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: queryKeys.units.all });
    },
    onError: (error) => toastApiError(error, tCommon("somethingWrong")),
  });
}

export function useAssignResident(unitId: string) {
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => unitsApi.assignResident(unitId, userId),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: queryKeys.units.detail(unitId) });
    },
    onError: (error) => toastApiError(error, tCommon("somethingWrong")),
  });
}

export function useUnassignResident(unitId: string) {
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => unitsApi.unassignResident(unitId, userId),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: queryKeys.units.detail(unitId) });
    },
    onError: (error) => toastApiError(error, tCommon("somethingWrong")),
  });
}
