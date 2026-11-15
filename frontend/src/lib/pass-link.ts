/** Builds the deep link encoded into a pass's QR code. Scanning it with any
 * camera app opens the guard's scan screen with the token pre-filled —
 * the guard still has to be signed in, so this is a convenience, not a
 * bypass of the real authorization check on the backend. */
export function guestPassLink(token: string, locale: string): string {
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return `${origin}/${locale}/guard/scan?token=${encodeURIComponent(token)}`;
}

/** Accepts either a raw token or a pasted guest-pass link and returns the
 * token, for the guard's "paste a code" fallback. */
export function extractTokenFromInput(input: string): string {
  const trimmed = input.trim();
  try {
    const url = new URL(trimmed);
    const token = url.searchParams.get("token");
    if (token) return token;
  } catch {
    // Not a URL — treat the whole input as the raw token.
  }
  return trimmed;
}
