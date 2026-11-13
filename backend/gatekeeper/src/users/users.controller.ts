import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { RegisterDto } from '../auth/dto/register.dto';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { CurrentRole } from '../auth/decorators/roles.decorator';
import { Role } from '../users/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import * as jwtStrategy from '../auth/strategies/jwt.strategy';

@Controller('users')
export class UsersController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(JwtAuthGuard, RoleGuard)
  @CurrentRole(Role.Admin)
  @Post('create')
  register(@Body() dto: RegisterDto) {
    return this.authService.createUser(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@CurrentUser() user: jwtStrategy.JwtPayload) {
    return { id: user.sub, email: user.email, role: user.role };
  }
}
