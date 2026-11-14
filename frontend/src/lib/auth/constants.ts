export const SESSION_COOKIE = "gk_session";

export const ROLE_HOME: Record<"admin" | "resident" | "guard", string> = {
  admin: "/admin",
  resident: "/resident/passes",
  guard: "/guard/scan",
};
