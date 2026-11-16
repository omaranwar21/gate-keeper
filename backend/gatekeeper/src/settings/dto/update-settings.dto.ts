import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateSettingsDto {
  // Omit or send null to clear the limit (unlimited).
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxActivePassesPerUnitPerDay?: number | null;
}
