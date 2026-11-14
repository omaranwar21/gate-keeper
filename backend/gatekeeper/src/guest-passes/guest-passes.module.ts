import { Module } from '@nestjs/common';
import { GuestPassesController } from './guest-passes.controller';
import { GuestPassesService } from './guest-passes.service';

@Module({
  controllers: [GuestPassesController],
  providers: [GuestPassesService],
})
export class GuestPassesModule {}
