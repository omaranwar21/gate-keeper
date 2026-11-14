import { randomBytes } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { DenyReason, PassType, ScanResult } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { PaginateOptions, paginator } from '../shared/utils/pagination';
import { Role } from '../users/role.enum';
import { CreateGuestPassDto } from './dto/create-guest-pass.dto';
import { ScanPassDto } from './dto/scan-pass.dto';
import { UpdateGuestPassDto } from './dto/update-guest-pass.dto';
import {
  cairoDayBounds,
  derivePassStatus,
  passStatusWhereClause,
  PassStatus,
  validatePassForScan,
} from './pass-validation';

const TOKEN_BYTES = 24;
const MAX_TOKEN_ATTEMPTS = 3;
const paginate = paginator({ perPage: 10 });

@Injectable()
export class GuestPassesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(residentId: string, dto: CreateGuestPassDto) {
    await this.assertResidentBelongsToUnit(residentId, dto.unitId);

    const validFrom = new Date(dto.validFrom);
    const validUntil = new Date(dto.validUntil);
    if (validUntil <= validFrom) {
      throw new BadRequestException('guestPasses.validWindowInvalid');
    }
    if (
      dto.type === PassType.recurring &&
      dto.dailyStartMin! >= dto.dailyEndMin!
    ) {
      throw new BadRequestException('guestPasses.dailyWindowInvalid');
    }

    const data = {
      unitId: dto.unitId,
      createdById: residentId,
      guestName: dto.guestName,
      type: dto.type,
      validFrom,
      validUntil,
      daysOfWeek: dto.type === PassType.recurring ? dto.daysOfWeek! : [],
      dailyStartMin:
        dto.type === PassType.recurring ? dto.dailyStartMin! : null,
      dailyEndMin: dto.type === PassType.recurring ? dto.dailyEndMin! : null,
    };

    for (let attempt = 1; attempt <= MAX_TOKEN_ATTEMPTS; attempt++) {
      try {
        return await this.prisma.guestPass.create({
          data: { ...data, token: this.generateToken() },
        });
      } catch (error) {
        if (!this.isTokenClash(error) || attempt === MAX_TOKEN_ATTEMPTS) {
          throw error;
        }
        // Astronomically unlikely 24-byte random collision — retry with a fresh token.
      }
    }
    throw new Error('unreachable');
  }

  async update(
    requester: { sub: string; role: Role },
    id: string,
    dto: UpdateGuestPassDto,
  ) {
    const pass = await this.prisma.guestPass.findUnique({ where: { id } });
    if (!pass) {
      throw new NotFoundException('guestPasses.notFound');
    }
    if (
      requester.role !== Role.Admin &&
      !(await this.residentBelongsToUnit(requester.sub, pass.unitId))
    ) {
      throw new NotFoundException('guestPasses.notFound');
    }
    if (pass.revokedAt || (pass.type === PassType.one_time && pass.usedAt)) {
      throw new ConflictException('guestPasses.cannotUpdateRevokedOrUsed');
    }
    if (
      (dto.daysOfWeek ||
        dto.dailyStartMin !== undefined ||
        dto.dailyEndMin !== undefined) &&
      pass.type !== PassType.recurring
    ) {
      throw new BadRequestException('guestPasses.recurringFieldsOnly');
    }

    const validFrom = dto.validFrom ? new Date(dto.validFrom) : pass.validFrom;
    const validUntil = dto.validUntil
      ? new Date(dto.validUntil)
      : pass.validUntil;
    if (validUntil <= validFrom) {
      throw new BadRequestException('guestPasses.validWindowInvalid');
    }

    const dailyStartMin = dto.dailyStartMin ?? pass.dailyStartMin;
    const dailyEndMin = dto.dailyEndMin ?? pass.dailyEndMin;
    if (
      pass.type === PassType.recurring &&
      dailyStartMin !== null &&
      dailyEndMin !== null &&
      dailyStartMin >= dailyEndMin
    ) {
      throw new BadRequestException('guestPasses.dailyWindowInvalid');
    }

    return this.prisma.guestPass.update({
      where: { id },
      data: {
        guestName: dto.guestName,
        validFrom,
        validUntil,
        daysOfWeek: dto.daysOfWeek,
        dailyStartMin,
        dailyEndMin,
      },
      include: { unit: { include: { building: true } } },
    });
  }

  async remove(requester: { sub: string; role: Role }, id: string) {
    const pass = await this.prisma.guestPass.findUnique({ where: { id } });
    if (!pass) {
      throw new NotFoundException('guestPasses.notFound');
    }
    if (
      requester.role !== Role.Admin &&
      !(await this.residentBelongsToUnit(requester.sub, pass.unitId))
    ) {
      // Same 404 whether the pass doesn't exist or just isn't this resident's.
      throw new NotFoundException('guestPasses.notFound');
    }

    // Hard delete, unlike revoke: AccessLog.passId is onDelete: SetNull in the
    // schema, so scan history is preserved (with its own guestName snapshot)
    // even after the pass row itself is gone.
    await this.prisma.guestPass.delete({ where: { id } });
  }

  async findMine(
    residentId: string,
    options?: PaginateOptions & { status?: PassStatus; today?: boolean },
  ) {
    const memberships = await this.prisma.unitResident.findMany({
      where: { userId: residentId },
      select: { unitId: true },
    });
    const unitIds = memberships.map((m) => m.unitId);

    const now = new Date();
    const conditions: Prisma.GuestPassWhereInput[] = [
      { unitId: { in: unitIds } },
    ];
    if (options?.status) {
      conditions.push(passStatusWhereClause(options.status, now));
    }
    if (options?.today) {
      const { start, end } = cairoDayBounds(now);
      conditions.push({ validFrom: { lt: end }, validUntil: { gte: start } });
    }

    const findManyArgs = {
      where: { AND: conditions },
      include: {
        unit: { include: { building: true } },
        revokedBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    } satisfies Prisma.GuestPassFindManyArgs;

    const result = await paginate<
      Prisma.GuestPassGetPayload<{ include: typeof findManyArgs.include }>,
      typeof findManyArgs
    >(this.prisma.guestPass, findManyArgs, options);

    return {
      ...result,
      data: result.data.map((pass) => ({ ...pass, status: derivePassStatus(pass, now) })),
    };
  }

  async findOneForResident(residentId: string, id: string) {
    const pass = await this.prisma.guestPass.findUnique({
      where: { id },
      include: {
        unit: { include: { building: true } },
        revokedBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    if (!pass || !(await this.residentBelongsToUnit(residentId, pass.unitId))) {
      // Same 404 whether the pass doesn't exist or just isn't this resident's —
      // never confirm another unit's pass exists.
      throw new NotFoundException('guestPasses.notFound');
    }

    return { ...pass, status: derivePassStatus(pass, new Date()) };
  }

  async revoke(requester: { sub: string; role: Role }, id: string) {
    const pass = await this.prisma.guestPass.findUnique({ where: { id } });
    if (!pass) {
      throw new NotFoundException('guestPasses.notFound');
    }
    if (
      requester.role !== Role.Admin &&
      !(await this.residentBelongsToUnit(requester.sub, pass.unitId))
    ) {
      throw new NotFoundException('guestPasses.notFound');
    }
    if (pass.revokedAt) {
      throw new ConflictException('guestPasses.alreadyRevoked');
    }

    return this.prisma.guestPass.update({
      where: { id },
      data: { revokedAt: new Date(), revokedById: requester.sub },
      include: {
        revokedBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            role: true,
          },
        },
      },
    });
  }

  async scan(guardId: string, dto: ScanPassDto) {
    const now = new Date();
    const pass = await this.prisma.guestPass.findUnique({
      where: { token: dto.token },
      include: { unit: { include: { building: true } } },
    });

    if (!pass) {
      await this.logScan({
        guardId,
        result: ScanResult.denied,
        reason: DenyReason.invalid_token,
      });
      return {
        result: ScanResult.denied,
        reason: DenyReason.invalid_token,
        guestName: null,
        unitNumber: null,
      };
    }

    const denyReason = validatePassForScan(pass, now);
    if (denyReason) {
      await this.logScan({
        guardId,
        pass,
        result: ScanResult.denied,
        reason: denyReason,
      });
      return this.toScanResponse(ScanResult.denied, pass, denyReason);
    }

    if (pass.type === PassType.one_time) {
      // Atomic conditional update: the WHERE clause is re-evaluated by Postgres
      // against the row's current state at the moment this single statement runs,
      // so two concurrent scans can never both see usedAt = null and both "win".
      const claim = await this.prisma.guestPass.updateMany({
        where: { id: pass.id, usedAt: null, revokedAt: null },
        data: { usedAt: now },
      });

      if (claim.count === 0) {
        const current = await this.prisma.guestPass.findUniqueOrThrow({
          where: { id: pass.id },
        });
        const lostReason =
          validatePassForScan(current, now) ?? DenyReason.already_used;
        await this.logScan({
          guardId,
          pass,
          result: ScanResult.denied,
          reason: lostReason,
        });
        return this.toScanResponse(ScanResult.denied, pass, lostReason);
      }
    }

    await this.logScan({ guardId, pass, result: ScanResult.allowed });
    return this.toScanResponse(ScanResult.allowed, pass);
  }

  private toScanResponse(
    result: ScanResult,
    pass: { guestName: string; unit: { number: string } },
    reason?: DenyReason,
  ) {
    return {
      result,
      reason: reason ?? null,
      guestName: pass.guestName,
      unit: pass.unit,
    };
  }

  private async logScan(params: {
    guardId: string;
    pass?: { id: string; unitId: string; guestName: string };
    result: ScanResult;
    reason?: DenyReason;
  }) {
    await this.prisma.accessLog.create({
      data: {
        guardId: params.guardId,
        passId: params.pass?.id ?? null,
        unitId: params.pass?.unitId ?? null,
        guestName: params.pass?.guestName ?? null,
        result: params.result,
        reason: params.reason ?? null,
      },
    });
  }

  private async residentBelongsToUnit(userId: string, unitId: string) {
    const membership = await this.prisma.unitResident.findUnique({
      where: { userId_unitId: { userId, unitId } },
    });
    return !!membership;
  }

  private async assertResidentBelongsToUnit(userId: string, unitId: string) {
    if (!(await this.residentBelongsToUnit(userId, unitId))) {
      // Don't distinguish "unit doesn't exist" from "not yours" either.
      throw new NotFoundException('units.notFound');
    }
  }

  private generateToken() {
    return randomBytes(TOKEN_BYTES).toString('base64url');
  }

  private isTokenClash(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      (error.meta?.target as string[] | undefined)?.includes('token')
    );
  }
}
