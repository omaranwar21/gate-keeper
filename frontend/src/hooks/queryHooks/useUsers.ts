import { useQuery } from "@tanstack/react-query";
import { usersApi, type PaginationQuery } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/query/keys";
import type { Role } from "@/types/api";

export function useUsersList(
  query: PaginationQuery & { role?: Role } = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: queryKeys.users.list(query),
    queryFn: () => usersApi.list(query),
    ...options,
  });
}
