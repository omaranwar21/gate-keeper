import type { Prisma } from '../generated/prisma/client';
import { ScanResult } from '../generated/prisma/enums';
import { cairoDayBounds } from '../shared/utils/cairo-time';

export interface AccessLogFilters {
  // Cairo-local calendar date ("YYYY-MM-DD"), matched against scannedAt.
  date?: string;
  buildingId?: string;
  unitId?: string;
  result?: ScanResult;
}

export function buildAccessLogWhere(
  filters: AccessLogFilters,
): Prisma.AccessLogWhereInput | undefined {
  const conditions: Prisma.AccessLogWhereInput[] = [];

  if (filters.date) {
    // Noon UTC always falls on the same Cairo calendar date as `date`
    // (Cairo is ahead of UTC), so it's a safe anchor for cairoDayBounds.
    const { start, end } = cairoDayBounds(
      new Date(`${filters.date}T12:00:00Z`),
    );
    conditions.push({ scannedAt: { gte: start, lt: end } });
  }
  if (filters.buildingId) {
    conditions.push({ unit: { buildingId: filters.buildingId } });
  }
  if (filters.unitId) {
    conditions.push({ unitId: filters.unitId });
  }
  if (filters.result) {
    conditions.push({ result: filters.result });
  }

  return conditions.length ? { AND: conditions } : undefined;
}
