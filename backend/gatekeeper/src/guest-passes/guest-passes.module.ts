import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { SettingsModule } from '../settings/settings.module';
import { GuestPassesController } from './guest-passes.controller';
import { GuestPassesService } from './guest-passes.service';

@Module({
  imports: [SettingsModule, RealtimeModule],
  controllers: [GuestPassesController],
  providers: [GuestPassesService],
})
export class GuestPassesModule {}
