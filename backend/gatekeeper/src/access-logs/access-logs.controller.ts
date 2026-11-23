import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PermittedRole } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Role } from '../users/role.enum';
import { AccessLogsService } from './access-logs.service';
import { FindAccessLogsQueryDto } from './dto/find-access-logs-query.dto';

@UseGuards(JwtAuthGuard, RoleGuard)
@PermittedRole(Role.Admin)
@Controller('access-logs')
export class AccessLogsController {
  constructor(private readonly accessLogsService: AccessLogsService) {}

  @Get()
  findAll(@Query() query: FindAccessLogsQueryDto) {
    return this.accessLogsService.findAll(query);
  }
}
