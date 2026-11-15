import { buildAccessLogWhere } from './access-log-filters';
import { cairoDateKey } from '../shared/utils/cairo-time';
import { ScanResult } from '../generated/prisma/enums';

describe('buildAccessLogWhere', () => {
  it('returns undefined when no filters are given', () => {
    expect(buildAccessLogWhere({})).toBeUndefined();
  });

  it('filters by the Cairo-local calendar day when date is given', () => {
    const where = buildAccessLogWhere({ date: '2026-01-15' });
    const condition = (
      where as { AND: Array<{ scannedAt: { gte: Date; lt: Date } }> }
    ).AND[0].scannedAt;

    expect(cairoDateKey(condition.gte)).toBe('2026-01-15');
    expect(cairoDateKey(new Date(condition.lt.getTime() - 1))).toBe('2026-01-15');
    expect(cairoDateKey(condition.lt)).toBe('2026-01-16');
    expect(condition.lt.getTime() - condition.gte.getTime()).toBe(24 * 60 * 60_000);
  });

  it('combines buildingId, unitId and result filters with AND', () => {
    const where = buildAccessLogWhere({
      buildingId: 'b1',
      unitId: 'u1',
      result: ScanResult.denied,
    });

    expect(where).toEqual({
      AND: [{ unit: { buildingId: 'b1' } }, { unitId: 'u1' }, { result: ScanResult.denied }],
    });
  });
});
