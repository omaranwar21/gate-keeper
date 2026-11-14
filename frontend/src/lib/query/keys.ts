export const queryKeys = {
  buildings: {
    list: (query: unknown) => ["buildings", "list", query] as const,
    all: ["buildings"] as const,
  },
  units: {
    mine: (query: unknown) => ["units", "mine", query] as const,
    list: (query: unknown) => ["units", "list", query] as const,
    detail: (id: string) => ["units", "detail", id] as const,
    all: ["units"] as const,
  },
  passes: {
    mine: (query: unknown) => ["passes", "mine", query] as const,
    detail: (id: string) => ["passes", "detail", id] as const,
    all: ["passes"] as const,
  },
  users: {
    list: (query: unknown) => ["users", "list", query] as const,
  },
  accessLog: {
    list: (query: unknown) => ["access-log", "list", query] as const,
  },
  dashboard: {
    summary: ["dashboard", "summary"] as const,
  },
} as const;
