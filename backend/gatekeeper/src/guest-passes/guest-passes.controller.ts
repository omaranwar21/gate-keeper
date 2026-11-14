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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentRole } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { Role } from '../users/role.enum';
import { CreateGuestPassDto } from './dto/create-guest-pass.dto';
import { FindMyPassesQueryDto } from './dto/find-my-passes-query.dto';
import { ScanPassDto } from './dto/scan-pass.dto';
import { UpdateGuestPassDto } from './dto/update-guest-pass.dto';
import { GuestPassesService } from './guest-passes.service';

@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('passes')
export class GuestPassesController {
  constructor(private readonly guestPassesService: GuestPassesService) {}

  @CurrentRole(Role.Resident)
  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateGuestPassDto) {
    return this.guestPassesService.create(user.sub, dto);
  }

  @CurrentRole(Role.Resident)
  @Get('mine')
  findMine(
    @CurrentUser() user: JwtPayload,
    @Query() query: FindMyPassesQueryDto,
  ) {
    return this.guestPassesService.findMine(user.sub, query);
  }

  @CurrentRole(Role.Resident)
  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.guestPassesService.findOneForResident(user.sub, id);
  }

  @CurrentRole(Role.Resident, Role.Admin)
  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateGuestPassDto,
  ) {
    return this.guestPassesService.update(user, id, dto);
  }

  @CurrentRole(Role.Resident, Role.Admin)
  @Patch(':id/revoke')
  revoke(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.guestPassesService.revoke(user, id);
  }

  @CurrentRole(Role.Resident, Role.Admin)
  @Delete(':id')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.guestPassesService.remove(user, id);
  }

  @CurrentRole(Role.Guard)
  @Post('scan')
  scan(@CurrentUser() user: JwtPayload, @Body() dto: ScanPassDto) {
    return this.guestPassesService.scan(user.sub, dto);
  }
}
