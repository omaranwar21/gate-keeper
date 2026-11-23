import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PermittedRole } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Role } from '../users/role.enum';
import { DashboardAnalyticsQueryDto } from './dto/dashboard-analytics-query.dto';
import { DashboardService } from './dashboard.service';

const DEFAULT_ANALYTICS_DAYS = 30;

@UseGuards(JwtAuthGuard, RoleGuard)
@PermittedRole(Role.Admin)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  summary() {
    return this.dashboardService.summary();
  }

  @Get('analytics')
  analytics(@Query() query: DashboardAnalyticsQueryDto) {
    return this.dashboardService.analytics(query.days ?? DEFAULT_ANALYTICS_DAYS);
  }
}
