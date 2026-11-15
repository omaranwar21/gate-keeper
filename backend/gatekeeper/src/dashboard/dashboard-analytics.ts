import { ScanResult } from '../generated/prisma/enums';
import { cairoDateKey, cairoHour } from '../shared/utils/cairo-time';

export interface EntriesTrendPoint {
  date: string;
  allowed: number;
  denied: number;
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

export type AnalyticsLogRow = {
  scannedAt: Date;
  result: ScanResult;
  unit: { id: string; building: { id: string; name: string } } | null;
};

// Buckets `logs` into one point per day for the `days` trailing days ending
// just before `end` (both Cairo-local calendar days), zero-filling days with
// no scans so the chart's x-axis has no gaps.
export function buildEntriesTrend(logs: AnalyticsLogRow[], end: Date, days: number): EntriesTrendPoint[] {
  const start = new Date(end.getTime() - days * 24 * 60 * 60_000);
  const byDate = new Map<string, { allowed: number; denied: number }>();
  for (let i = 0; i < days; i++) {
    const date = cairoDateKey(new Date(start.getTime() + i * 24 * 60 * 60_000));
    byDate.set(date, { allowed: 0, denied: 0 });
  }

  for (const log of logs) {
    const bucket = byDate.get(cairoDateKey(log.scannedAt));
    if (!bucket) continue; // outside the requested window (shouldn't happen given the query's own filter)
    if (log.result === ScanResult.allowed) bucket.allowed++;
    else bucket.denied++;
  }

  return Array.from(byDate.entries()).map(([date, counts]) => ({ date, ...counts }));
}

// Highest scan volume first.
export function buildScansByBuilding(logs: AnalyticsLogRow[]): BuildingScanCount[] {
  const byBuilding = new Map<string, BuildingScanCount>();
  for (const log of logs) {
    if (!log.unit) continue; // invalid_token denials have no resolved unit/building
    const building = log.unit.building;
    const bucket = byBuilding.get(building.id) ?? {
      buildingId: building.id,
      buildingName: building.name,
      allowed: 0,
      denied: 0,
    };
    if (log.result === ScanResult.allowed) bucket.allowed++;
    else bucket.denied++;
    byBuilding.set(building.id, bucket);
  }
  return Array.from(byBuilding.values()).sort((a, b) => b.allowed + b.denied - (a.allowed + a.denied));
}

// Fixed 24-entry array (hour 0-23), even for hours with no scans.
export function buildPeakHours(logs: AnalyticsLogRow[]): PeakHourCount[] {
  const counts = new Array<number>(24).fill(0);
  for (const log of logs) {
    counts[cairoHour(log.scannedAt)]++;
  }
  return counts.map((count, hour) => ({ hour, count }));
}
