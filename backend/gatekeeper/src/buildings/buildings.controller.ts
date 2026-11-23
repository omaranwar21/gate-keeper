import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PermittedRole } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { SuccessMessage } from '../i18n/success-message.decorator';
import { PaginationQueryDto } from '../shared/dto/pagination-query.dto';
import { Role } from '../users/role.enum';
import { BuildingsService } from './buildings.service';
import { CreateBuildingDto } from './dto/create-building.dto';
import { UpdateBuildingDto } from './dto/update-building.dto';

@UseGuards(JwtAuthGuard, RoleGuard)
@PermittedRole(Role.Admin)
@Controller('buildings')
export class BuildingsController {
  constructor(private readonly buildingsService: BuildingsService) {}

  @Post()
  @SuccessMessage('buildings.created')
  create(@Body() dto: CreateBuildingDto) {
    return this.buildingsService.create(dto);
  }

  @Get()
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.buildingsService.findAll(pagination);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.buildingsService.findOne(id);
  }

  @Patch(':id')
  @SuccessMessage('buildings.updated')
  update(@Param('id') id: string, @Body() dto: UpdateBuildingDto) {
    return this.buildingsService.update(id, dto);
  }

  @Delete(':id')
  @SuccessMessage('buildings.deleted')
  remove(@Param('id') id: string) {
    return this.buildingsService.remove(id);
  }
}
