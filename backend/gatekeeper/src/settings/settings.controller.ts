import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { PermittedRole } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { SuccessMessage } from '../i18n/success-message.decorator';
import { Role } from '../users/role.enum';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SettingsService } from './settings.service';

@UseGuards(JwtAuthGuard, RoleGuard)
@PermittedRole(Role.Admin)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  get() {
    return this.settingsService.get();
  }

  @Patch()
  @SuccessMessage('settings.updated')
  update(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.update(dto);
  }
}
