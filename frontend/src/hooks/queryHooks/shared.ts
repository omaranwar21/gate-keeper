import { toast } from "sonner";
import { isApiError, apiErrorMessages } from "@/lib/api/error";

/** Standard onError for mutation hooks: show the backend's message when
 * there is one, otherwise a generic fallback. */
export function toastApiError(error: unknown, fallback: string) {
  toast.error(isApiError(error) ? apiErrorMessages(error)[0] ?? fallback : fallback);
}
