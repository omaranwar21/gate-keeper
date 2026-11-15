import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { GuestPassesController } from './guest-passes.controller';
import { GuestPassesService } from './guest-passes.service';

@Module({
  imports: [SettingsModule],
  controllers: [GuestPassesController],
  providers: [GuestPassesService],
})
export class GuestPassesModule {}
