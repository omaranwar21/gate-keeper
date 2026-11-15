import { useQuery } from "@tanstack/react-query";
import { accessLogApi, type AccessLogQuery } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/query/keys";

export function useAccessLogList(query: AccessLogQuery = {}) {
  return useQuery({
    queryKey: queryKeys.accessLog.list(query),
    queryFn: () => accessLogApi.list(query),
  });
}
