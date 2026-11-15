import { buildAccessLogWhere } from './access-log-filters';
import { ScanResult } from '../generated/prisma/enums';

describe('buildAccessLogWhere', () => {
  it('returns undefined when no filters are given', () => {
    expect(buildAccessLogWhere({})).toBeUndefined();
  });

  it('bounds scannedAt by the given from/to instants', () => {
    const where = buildAccessLogWhere({
      from: '2026-01-15T06:00:00.000Z',
      to: '2026-01-16T15:00:00.000Z',
    });

    expect(where).toEqual({
      AND: [
        {
          scannedAt: {
            gte: new Date('2026-01-15T06:00:00.000Z'),
            lte: new Date('2026-01-16T15:00:00.000Z'),
          },
        },
      ],
    });
  });

  it('allows an open-ended period when only one bound is given', () => {
    expect(buildAccessLogWhere({ from: '2026-01-15T06:00:00.000Z' })).toEqual({
      AND: [{ scannedAt: { gte: new Date('2026-01-15T06:00:00.000Z') } }],
    });
    expect(buildAccessLogWhere({ to: '2026-01-16T15:00:00.000Z' })).toEqual({
      AND: [{ scannedAt: { lte: new Date('2026-01-16T15:00:00.000Z') } }],
    });
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
