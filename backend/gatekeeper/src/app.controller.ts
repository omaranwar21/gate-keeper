import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from './auth/decorators/current-user.decorator';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RoleGuard } from './auth/guards/role.guard';
import type { JwtPayload } from './auth/strategies/jwt.strategy';
import { Role } from './users/role.enum';
import { AppService } from './app.service';
import { CurrentRole } from './auth/decorators/roles.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@CurrentUser() user: JwtPayload) {
    return user;
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @CurrentRole(Role.Admin)
  @Get('admin')
  getAdminOnly() {
    return { message: 'Welcome, admin!' };
  }
}
