import { apiClient } from "./client";
import type {
  AccessLog,
  Building,
  GuestPass,
  PaginatedResult,
  PassStatus,
  Role,
  ScanResponse,
  SuccessEnvelope,
  Unit,
  UnitWithResidents,
  User,
} from "@/types/api";

export interface PaginationQuery {
  page?: number;
  perPage?: number;
}

export interface UnitResidentEntry {
  unitId: string;
  userId: string;
  assignedAt: string;
  user: User;
}

// ---- auth -------------------------------------------------------

export const authApi = {
  // /api/auth/login (the Next.js route handler, not the backend directly)
  // decodes the backend's envelope itself and re-shapes it flat.
  login: (data: { email: string; password: string }) =>
    apiClient.post<{ role: Role; message: string }>("/auth/login", data).then((r) => r.data),
};

// ---- buildings -------------------------------------------------------

export const buildingsApi = {
  list: (query: PaginationQuery = {}) =>
    apiClient
      .get<PaginatedResult<Building>>("/buildings", { params: query })
      .then((r) => r.data),
  create: (data: { name: string }) =>
    apiClient.post<SuccessEnvelope<Building>>("/buildings", data).then((r) => r.data),
  update: (id: string, data: { name?: string }) =>
    apiClient.patch<SuccessEnvelope<Building>>(`/buildings/${id}`, data).then((r) => r.data),
  remove: (id: string) =>
    apiClient.delete<{ message: string }>(`/buildings/${id}`).then((r) => r.data),
};

// ---- units -------------------------------------------------------

export interface CreateUnitInput {
  buildingId: string;
  number: string;
  floor?: number;
}

export const unitsApi = {
  listMine: (query: PaginationQuery = {}) =>
    apiClient
      .get<
        PaginatedResult<{
          unitId: string;
          userId: string;
          assignedAt: string;
          unit: Unit;
        }>
      >("/units/mine", { params: query })
      .then((r) => r.data),
  list: (query: PaginationQuery & { buildingId?: string } = {}) =>
    apiClient
      .get<PaginatedResult<Unit>>("/units", { params: query })
      .then((r) => r.data),
  getOne: (id: string) =>
    apiClient.get<UnitWithResidents>(`/units/${id}`).then((r) => r.data),
  create: (data: CreateUnitInput) =>
    apiClient.post<SuccessEnvelope<Unit>>("/units", data).then((r) => r.data),
  update: (id: string, data: { number?: string; floor?: number }) =>
    apiClient.patch<SuccessEnvelope<Unit>>(`/units/${id}`, data).then((r) => r.data),
  remove: (id: string) =>
    apiClient.delete<{ message: string }>(`/units/${id}`).then((r) => r.data),
  assignResident: (id: string, userId: string) =>
    apiClient
      .post<SuccessEnvelope<UnitResidentEntry>>(`/units/${id}/residents`, { userId })
      .then((r) => r.data),
  unassignResident: (id: string, userId: string) =>
    apiClient
      .delete<{ message: string }>(`/units/${id}/residents/${userId}`)
      .then((r) => r.data),
};

// ---- guest passes -------------------------------------------------------

export interface CreateGuestPassInput {
  unitId: string;
  guestName: string;
  type: "one_time" | "recurring";
  validFrom: string;
  validUntil: string;
  daysOfWeek?: number[];
  dailyStartMin?: number;
  dailyEndMin?: number;
}

export type UpdateGuestPassInput = Partial<
  Omit<CreateGuestPassInput, "unitId" | "type">
>;

export interface ListMyPassesQuery extends PaginationQuery {
  status?: PassStatus;
  today?: boolean;
}

export const passesApi = {
  listMine: (query: ListMyPassesQuery = {}) =>
    apiClient
      .get<PaginatedResult<GuestPass>>("/passes/mine", { params: query })
      .then((r) => r.data),
  getOne: (id: string) =>
    apiClient.get<GuestPass>(`/passes/${id}`).then((r) => r.data),
  create: (data: CreateGuestPassInput) =>
    apiClient.post<SuccessEnvelope<GuestPass>>("/passes", data).then((r) => r.data),
  update: (id: string, data: UpdateGuestPassInput) =>
    apiClient.patch<SuccessEnvelope<GuestPass>>(`/passes/${id}`, data).then((r) => r.data),
  revoke: (id: string) =>
    apiClient.patch<SuccessEnvelope<GuestPass>>(`/passes/${id}/revoke`).then((r) => r.data),
  remove: (id: string) =>
    apiClient.delete<{ message: string }>(`/passes/${id}`).then((r) => r.data),
  scan: (token: string) =>
    apiClient.post<ScanResponse>("/passes/scan", { token }).then((r) => r.data),
};

// ---- users (admin resident directory) -----------------------------------

export const usersApi = {
  list: (query: PaginationQuery & { role?: Role } = {}) =>
    apiClient
      .get<PaginatedResult<User>>("/users", { params: query })
      .then((r) => r.data),
};

// ---- access log + dashboard summary (also pending, same doc) ------------

export interface AccessLogQuery extends PaginationQuery {
  date?: string;
  buildingId?: string;
  unitId?: string;
  result?: "allowed" | "denied";
}

export const accessLogApi = {
  list: (query: AccessLogQuery = {}) =>
    apiClient
      .get<PaginatedResult<AccessLog>>("/access-logs", { params: query })
      .then((r) => r.data),
};

export interface DashboardSummary {
  entriesToday: number;
  deniedToday: number;
  activePasses: number;
  expectedVisitors: Array<{
    passId: string;
    guestName: string;
    unitNumber: string;
    buildingName: string;
    validFrom: string;
    validUntil: string;
    type: "one_time" | "recurring";
  }>;
}

export interface EntriesTrendPoint {
  date: string;
  allowed: number;
  denied: number;
}

export interface PassStatusCount {
  status: PassStatus;
  count: number;
}

export interface BuildingScanCount {
  buildingId: string;
  buildingName: string;
  allowed: number;
  denied: number;
}

export interface PeakHourCount {
  hour: number;
  count: number;
}

export interface DashboardAnalytics {
  entriesTrend: EntriesTrendPoint[];
  passStatusBreakdown: PassStatusCount[];
  scansByBuilding: BuildingScanCount[];
  peakHours: PeakHourCount[];
}

export const dashboardApi = {
  summary: () =>
    apiClient.get<DashboardSummary>("/dashboard/summary").then((r) => r.data),
  analytics: (days?: number) =>
    apiClient
      .get<DashboardAnalytics>("/dashboard/analytics", { params: { days } })
      .then((r) => r.data),
};
