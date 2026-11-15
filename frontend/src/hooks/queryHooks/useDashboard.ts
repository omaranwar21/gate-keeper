import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/query/keys";

export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboard.summary,
    queryFn: dashboardApi.summary,
  });
}

export function useDashboardAnalytics(days?: number) {
  return useQuery({
    queryKey: queryKeys.dashboard.analytics({ days }),
    queryFn: () => dashboardApi.analytics(days),
  });
}
