import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginateOptions, paginator } from '../shared/utils/pagination';
import { CreateBuildingDto } from './dto/create-building.dto';
import { UpdateBuildingDto } from './dto/update-building.dto';

const paginate = paginator({ perPage: 10 });

@Injectable()
export class BuildingsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateBuildingDto) {
    return this.prisma.building.create({ data: dto }).catch((error) => {
      throw this.mapError(error);
    });
  }

  findAll(options?: PaginateOptions) {
    return paginate(this.prisma.building, { orderBy: { name: 'asc' } }, options);
  }

  async findOne(id: string) {
    const building = await this.prisma.building.findUnique({ where: { id } });
    if (!building) {
      throw new NotFoundException('buildings.notFound');
    }
    return building;
  }

  async update(id: string, dto: UpdateBuildingDto) {
    await this.findOne(id);
    return this.prisma.building.update({ where: { id }, data: dto }).catch((error) => {
      throw this.mapError(error);
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.building.delete({ where: { id } }).catch((error) => {
      throw this.mapError(error);
    });
  }

  private mapError(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return new ConflictException('buildings.nameTaken');
      }
      if (error.code === 'P2003') {
        return new ConflictException('buildings.hasUnits');
      }
    }
    return error;
  }
}
