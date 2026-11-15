import type { Prisma } from '../generated/prisma/client';
import { ScanResult } from '../generated/prisma/enums';

export interface AccessLogFilters {
  // ISO instants bounding scannedAt (inclusive); the frontend combines a
  // picked date + time into these, the same way guest passes are created.
  from?: string;
  to?: string;
  buildingId?: string;
  unitId?: string;
  result?: ScanResult;
}

export function buildAccessLogWhere(
  filters: AccessLogFilters,
): Prisma.AccessLogWhereInput | undefined {
  const conditions: Prisma.AccessLogWhereInput[] = [];

  if (filters.from || filters.to) {
    conditions.push({
      scannedAt: {
        ...(filters.from ? { gte: new Date(filters.from) } : {}),
        ...(filters.to ? { lte: new Date(filters.to) } : {}),
      },
    });
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
