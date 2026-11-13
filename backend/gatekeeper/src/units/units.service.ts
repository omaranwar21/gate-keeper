import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../users/role.enum';
import { AssignResidentDto } from './dto/assign-resident.dto';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

@Injectable()
export class UnitsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUnitDto) {
    const building = await this.prisma.building.findUnique({
      where: { id: dto.buildingId },
    });
    if (!building) {
      throw new BadRequestException('Building not found');
    }
    return this.prisma.unit.create({ data: dto }).catch((error) => {
      throw this.mapError(error);
    });
  }

  findAll(buildingId?: string) {
    return this.prisma.unit.findMany({
      where: buildingId ? { buildingId } : undefined,
      include: { building: true },
      orderBy: [{ buildingId: 'asc' }, { number: 'asc' }],
    });
  }

  async findOne(id: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: {
        building: true,
        residents: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                role: true,
              },
            },
          },
        },
      },
    });
    if (!unit) {
      throw new NotFoundException('Unit not found');
    }
    return unit;
  }

  async update(id: string, dto: UpdateUnitDto) {
    await this.findOne(id);
    return this.prisma.unit
      .update({ where: { id }, data: dto })
      .catch((error) => {
        throw this.mapError(error);
      });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.unit.delete({ where: { id } }).catch((error) => {
      throw this.mapError(error);
    });
  }

  async assignResident(unitId: string, dto: AssignResidentDto) {
    await this.findOne(unitId);

    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (user.role !== Role.Resident) {
      throw new BadRequestException('User is not a resident');
    }

    return this.prisma.unitResident
      .create({
        data: { unitId, userId: dto.userId },
        select: {
          unitId: true,
          userId: true,
          assignedAt: true,
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              phone: true,
              role: true,
            },
          },
        },
      })
      .catch((error) => {
        throw this.mapError(error);
      });
  }

  async unassignResident(unitId: string, userId: string) {
    await this.prisma.unitResident
      .delete({ where: { userId_unitId: { userId, unitId } } })
      .catch((error) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          throw new NotFoundException('Resident is not assigned to this unit');
        }
        throw error;
      });
  }

  findMyUnits(userId: string) {
    return this.prisma.unitResident.findMany({
      where: { userId },
      include: { unit: { include: { building: true } } },
    });
  }

  private mapError(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return new ConflictException(
          'This unit/resident combination already exists',
        );
      }
      if (error.code === 'P2003') {
        return new ConflictException(
          'Cannot delete a unit that still has related records',
        );
      }
    }
    return error;
  }
}
