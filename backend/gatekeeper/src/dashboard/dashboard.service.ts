import { Injectable } from '@nestjs/common';
import { PassType, ScanResult } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import {
  PASS_STATUSES,
  passStatusWhereClause,
  type PassStatus,
} from '../guest-passes/pass-validation';
import { cairoDayBounds } from '../shared/utils/cairo-time';
import { buildEntriesTrend, buildPeakHours, buildScansByBuilding } from './dashboard-analytics';
import type { EntriesTrendPoint, BuildingScanCount, PeakHourCount } from './dashboard-analytics';

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
    type: PassType;
  }>;
}

export interface PassStatusCount {
  status: PassStatus;
  count: number;
}

export interface DashboardAnalytics {
  entriesTrend: EntriesTrendPoint[];
  passStatusBreakdown: PassStatusCount[];
  scansByBuilding: BuildingScanCount[];
  peakHours: PeakHourCount[];
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(): Promise<DashboardSummary> {
    const now = new Date();
    const { start, end } = cairoDayBounds(now);
    // A one-time pass stops being "expected" once it's used, even if its
    // window still covers today; recurring passes never set usedAt.
    const notUsedOneTime = { OR: [{ type: { not: PassType.one_time } }, { usedAt: null }] };

    const [entriesToday, deniedToday, activePasses, expectedPasses] = await Promise.all([
      this.prisma.accessLog.count({
        where: { scannedAt: { gte: start, lt: end }, result: ScanResult.allowed },
      }),
      this.prisma.accessLog.count({
        where: { scannedAt: { gte: start, lt: end }, result: ScanResult.denied },
      }),
      this.prisma.guestPass.count({ where: passStatusWhereClause('active', now) }),
      this.prisma.guestPass.findMany({
        where: {
          revokedAt: null,
          validFrom: { lt: end },
          validUntil: { gte: start },
          ...notUsedOneTime,
        },
        include: { unit: { include: { building: true } } },
        orderBy: { validFrom: 'asc' },
      }),
    ]);

    return {
      entriesToday,
      deniedToday,
      activePasses,
      expectedVisitors: expectedPasses.map((pass) => ({
        passId: pass.id,
        guestName: pass.guestName,
        unitNumber: pass.unit.number,
        buildingName: pass.unit.building.name,
        validFrom: pass.validFrom.toISOString(),
        validUntil: pass.validUntil.toISOString(),
        type: pass.type,
      })),
    };
  }

  async analytics(days: number): Promise<DashboardAnalytics> {
    const now = new Date();
    const { end } = cairoDayBounds(now);
    const start = new Date(end.getTime() - days * 24 * 60 * 60_000);

    const [logs, passStatusBreakdown] = await Promise.all([
      this.prisma.accessLog.findMany({
        where: { scannedAt: { gte: start, lt: end } },
        select: {
          scannedAt: true,
          result: true,
          unit: { select: { id: true, building: { select: { id: true, name: true } } } },
        },
      }),
      this.passStatusBreakdown(now),
    ]);

    return {
      entriesTrend: buildEntriesTrend(logs, end, days),
      passStatusBreakdown,
      scansByBuilding: buildScansByBuilding(logs),
      peakHours: buildPeakHours(logs),
    };
  }

  private async passStatusBreakdown(now: Date): Promise<PassStatusCount[]> {
    const counts = await Promise.all(
      PASS_STATUSES.map((status) => this.prisma.guestPass.count({ where: passStatusWhereClause(status, now) })),
    );
    return PASS_STATUSES.map((status, i) => ({ status, count: counts[i] }));
  }
}
