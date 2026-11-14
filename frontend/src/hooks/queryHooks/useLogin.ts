import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/api/endpoints";
import { ROLE_HOME } from "@/lib/auth/constants";
import type { LoginInput } from "@/lib/validation/auth";
import { useRouter } from "@/i18n/navigation";

// onError is left to the caller: the login form shows an inline alert
// (not a toast) and needs to tell a 401 apart from other failures.
export function useUserLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: LoginInput) => authApi.login(data),
    onSuccess: (response) => {
      router.replace(ROLE_HOME[response.role]);
    },
  });
}
