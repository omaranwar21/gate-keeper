// Mirrors backend/gatekeeper/prisma/schema.prisma and the Nest DTOs exactly.
// Keep in sync by hand — the backend is not touched by this project.

export const ROLES = ["admin", "resident", "guard"] as const;
export type Role = (typeof ROLES)[number];

export const PASS_TYPES = ["one_time", "recurring"] as const;
export type PassType = (typeof PASS_TYPES)[number];

export const PASS_STATUSES = ["active", "used", "expired", "revoked"] as const;
export type PassStatus = (typeof PASS_STATUSES)[number];

export const SCAN_RESULTS = ["allowed", "denied"] as const;
export type ScanResult = (typeof SCAN_RESULTS)[number];

export const DENY_REASONS = [
  "invalid_token",
  "revoked",
  "already_used",
  "expired",
  "not_yet_valid",
  "outside_time_window",
] as const;
export type DenyReason = (typeof DENY_REASONS)[number];

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Building {
  id: string;
  name: string;
  createdAt: string;
}

export interface Unit {
  id: string;
  buildingId: string;
  number: string;
  floor: number | null;
  createdAt: string;
  building?: Building;
}

export interface UnitWithResidents extends Unit {
  residents: Array<{
    userId: string;
    unitId: string;
    assignedAt: string;
    user: User;
  }>;
}

export interface GuestPass {
  id: string;
  unitId: string;
  createdById: string;
  guestName: string;
  type: PassType;
  token: string;
  validFrom: string;
  validUntil: string;
  daysOfWeek: number[];
  dailyStartMin: number | null;
  dailyEndMin: number | null;
  usedAt: string | null;
  revokedAt: string | null;
  revokedById: string | null;
  createdAt: string;
  updatedAt: string;
  status?: PassStatus;
  unit?: Unit;
  revokedBy?: User | null;
}

export interface AccessLog {
  id: string;
  passId: string | null;
  unitId: string | null;
  guardId: string;
  result: ScanResult;
  reason: DenyReason | null;
  guestName: string | null;
  scannedAt: string;
  unit?: Unit | null;
  pass?: Pick<GuestPass, "id" | "guestName" | "type"> | null;
  guard?: Pick<User, "id" | "fullName">;
}

export interface PaginationMeta {
  total: number;
  lastPage: number;
  currentPage: number;
  perPage: number;
  prev: number | null;
  next: number | null;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
}

/** Envelope the backend wraps mutation responses in: `data` is the created/
 * updated resource, `message` is a success message translated per the
 * request's Content-Language header. */
export interface SuccessEnvelope<T> {
  data: T;
  message: string;
}

export interface ScanResponse {
  result: ScanResult;
  reason: DenyReason | null;
  guestName: string | null;
  unit:
    | (Pick<Unit, "id" | "buildingId" | "number" | "floor" | "createdAt"> & {
        building: Building;
      })
    | null;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}
