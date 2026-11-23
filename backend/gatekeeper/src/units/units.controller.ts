import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PermittedRole } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { PaginationQueryDto } from '../shared/dto/pagination-query.dto';
import { Role } from '../users/role.enum';
import { AssignResidentDto } from './dto/assign-resident.dto';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { UnitsService } from './units.service';
import { SuccessMessage } from '../i18n/success-message.decorator';

@UseGuards(JwtAuthGuard)
@Controller({ path: 'units', version: '1' })
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @UseGuards(RoleGuard)
  @PermittedRole(Role.Resident)
  @Get('mine')
  findMine(@CurrentUser() user: JwtPayload, @Query() pagination: PaginationQueryDto) {
    return this.unitsService.findMyUnits(user.sub, pagination);
  }

  @UseGuards(RoleGuard)
  @PermittedRole(Role.Admin)
  @Post()
  @SuccessMessage('units.created')
  create(@Body() dto: CreateUnitDto) {
    return this.unitsService.create(dto);
  }

  @UseGuards(RoleGuard)
  @PermittedRole(Role.Admin)
  @Get()
  findAll(@Query('buildingId') buildingId?: string, @Query() pagination?: PaginationQueryDto) {
    return this.unitsService.findAll(buildingId, pagination);
  }

  @UseGuards(RoleGuard)
  @PermittedRole(Role.Admin)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.unitsService.findOne(id);
  }

  @UseGuards(RoleGuard)
  @PermittedRole(Role.Admin)
  @Patch(':id')
  @SuccessMessage('units.updated')
  update(@Param('id') id: string, @Body() dto: UpdateUnitDto) {
    return this.unitsService.update(id, dto);
  }

  @UseGuards(RoleGuard)
  @PermittedRole(Role.Admin)
  @Delete(':id')
  @SuccessMessage('units.deleted')
  remove(@Param('id') id: string) {
    return this.unitsService.remove(id);
  }

  @UseGuards(RoleGuard)
  @PermittedRole(Role.Admin)
  @Post(':id/residents')
  @SuccessMessage('units.residentAssigned')
  assignResident(@Param('id') id: string, @Body() dto: AssignResidentDto) {
    return this.unitsService.assignResident(id, dto);
  }

  @UseGuards(RoleGuard)
  @PermittedRole(Role.Admin)
  @Delete(':id/residents/:userId')
  @SuccessMessage('units.residentUnassigned')
  unassignResident(@Param('id') id: string, @Param('userId') userId: string) {
    return this.unitsService.unassignResident(id, userId);
  }
}
