import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginateOptions, paginator } from '../shared/utils/pagination';
import { AccessLogFilters, buildAccessLogWhere } from './access-log-filters';

const paginate = paginator({ perPage: 20 });

@Injectable()
export class AccessLogsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(options?: PaginateOptions & AccessLogFilters) {
    return paginate(
      this.prisma.accessLog,
      {
        where: buildAccessLogWhere(options ?? {}),
        include: {
          unit: { include: { building: true } },
          pass: { select: { id: true, guestName: true, type: true } },
          guard: { select: { id: true, fullName: true } },
        },
        orderBy: { scannedAt: 'desc' },
      },
      options,
    );
  }
}
