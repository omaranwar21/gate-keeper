import { ScanResult } from '../generated/prisma/enums';
import {
  buildEntriesTrend,
  buildPeakHours,
  buildScansByBuilding,
  type AnalyticsLogRow,
} from './dashboard-analytics';

function log(overrides: Partial<AnalyticsLogRow> = {}): AnalyticsLogRow {
  return {
    scannedAt: new Date('2026-01-14T08:00:00.000Z'), // Wed 10:00 Cairo
    result: ScanResult.allowed,
    unit: { id: 'unit-1', building: { id: 'building-1', name: 'Tower A' } },
    ...overrides,
  };
}

describe('buildEntriesTrend', () => {
  it('zero-fills every day in the window and buckets by Cairo calendar day', () => {
    // Window: 3 days ending at 2026-01-15T00:00:00Z Cairo midnight (i.e.
    // 2026-01-12, 2026-01-13, 2026-01-14).
    const end = new Date('2026-01-14T22:00:00.000Z'); // 2026-01-15 00:00 Cairo
    const logs = [
      log({ scannedAt: new Date('2026-01-14T08:00:00.000Z'), result: ScanResult.allowed }), // 2026-01-14 Cairo
      log({ scannedAt: new Date('2026-01-14T20:00:00.000Z'), result: ScanResult.denied }), // 2026-01-14 Cairo (22:00 local)
      log({ scannedAt: new Date('2026-01-12T06:00:00.000Z'), result: ScanResult.allowed }), // 2026-01-12 Cairo
    ];

    const trend = buildEntriesTrend(logs, end, 3);

    expect(trend).toEqual([
      { date: '2026-01-12', allowed: 1, denied: 0 },
      { date: '2026-01-13', allowed: 0, denied: 0 },
      { date: '2026-01-14', allowed: 1, denied: 1 },
    ]);
  });

  it('returns all-zero days when there are no logs', () => {
    const end = new Date('2026-01-14T22:00:00.000Z'); // 2026-01-15 00:00 Cairo
    expect(buildEntriesTrend([], end, 2)).toEqual([
      { date: '2026-01-13', allowed: 0, denied: 0 },
      { date: '2026-01-14', allowed: 0, denied: 0 },
    ]);
  });
});

describe('buildScansByBuilding', () => {
  it('groups by building and ignores logs with no resolved unit', () => {
    const logs = [
      log({ unit: { id: 'u1', building: { id: 'b1', name: 'Tower A' } }, result: ScanResult.allowed }),
      log({ unit: { id: 'u2', building: { id: 'b1', name: 'Tower A' } }, result: ScanResult.denied }),
      log({ unit: { id: 'u3', building: { id: 'b2', name: 'Tower B' } }, result: ScanResult.allowed }),
      log({ unit: null, result: ScanResult.denied }), // invalid_token — no building to attribute to
    ];

    expect(buildScansByBuilding(logs)).toEqual([
      { buildingId: 'b1', buildingName: 'Tower A', allowed: 1, denied: 1 },
      { buildingId: 'b2', buildingName: 'Tower B', allowed: 1, denied: 0 },
    ]);
  });

  it('sorts by total scan volume descending', () => {
    const logs = [
      log({ unit: { id: 'u1', building: { id: 'quiet', name: 'Quiet' } } }),
      log({ unit: { id: 'u2', building: { id: 'busy', name: 'Busy' } } }),
      log({ unit: { id: 'u2', building: { id: 'busy', name: 'Busy' } } }),
    ];

    expect(buildScansByBuilding(logs).map((b) => b.buildingId)).toEqual(['busy', 'quiet']);
  });
});

describe('buildPeakHours', () => {
  it('returns a fixed 24-entry array bucketed by Cairo local hour', () => {
    const logs = [
      log({ scannedAt: new Date('2026-01-14T08:00:00.000Z') }), // 10:00 Cairo
      log({ scannedAt: new Date('2026-01-14T08:30:00.000Z') }), // 10:30 Cairo — same hour bucket
      log({ scannedAt: new Date('2026-01-14T20:00:00.000Z') }), // 22:00 Cairo
    ];

    const hours = buildPeakHours(logs);

    expect(hours).toHaveLength(24);
    expect(hours[10]).toEqual({ hour: 10, count: 2 });
    expect(hours[22]).toEqual({ hour: 22, count: 1 });
    expect(hours[0]).toEqual({ hour: 0, count: 0 });
  });
});
