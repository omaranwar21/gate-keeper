import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

const SETTINGS_ID = 1;

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  get() {
    return this.prisma.compoundSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID },
      update: {},
    });
  }

  update(dto: UpdateSettingsDto) {
    return this.prisma.compoundSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, maxActivePassesPerUnitPerDay: dto.maxActivePassesPerUnitPerDay },
      update: { maxActivePassesPerUnitPerDay: dto.maxActivePassesPerUnitPerDay },
    });
  }

  async getMaxActivePassesPerUnitPerDay(): Promise<number | null> {
    const settings = await this.prisma.compoundSettings.findUnique({ where: { id: SETTINGS_ID } });
    return settings?.maxActivePassesPerUnitPerDay ?? null;
  }
}
