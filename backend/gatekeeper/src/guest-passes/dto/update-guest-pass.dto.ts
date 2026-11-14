import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

// unitId and type are deliberately not editable: moving a pass to another
// unit, or switching one-time <-> recurring, changes what the row's other
// columns mean (e.g. usedAt). Revoke and create a new pass instead.
export class UpdateGuestPassDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  guestName?: string;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  // Recurring passes only (0 = Sunday ... 6 = Saturday); rejected by the
  // service for a one-time pass.
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  @Type(() => Number)
  daysOfWeek?: number[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1439)
  @Type(() => Number)
  dailyStartMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1439)
  @Type(() => Number)
  dailyEndMin?: number;
}
