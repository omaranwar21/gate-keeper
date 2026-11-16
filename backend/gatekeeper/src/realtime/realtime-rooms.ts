import { Role } from '../users/role.enum';

// Socket.IO room names. Kept free of Nest imports so it's unit-testable
// (see AGENTS.md: Nest's packages are ESM-only, unit specs avoid them).
export const ADMINS_ROOM = 'admins';

export function unitRoom(unitId: string): string {
  return `unit:${unitId}`;
}

/** The rooms a newly connected socket joins. Admins hear every scan; a
 * resident only hears scans for the units they belong to; guards join
 * nothing (they already see their own scan result in the HTTP response). */
export function roomsForUser(role: Role, unitIds: string[]): string[] {
  if (role === Role.Admin) return [ADMINS_ROOM];
  if (role === Role.Resident) return unitIds.map(unitRoom);
  return [];
}
