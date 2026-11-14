import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { PassType } from '../../generated/prisma/enums';

export class CreateGuestPassDto {
  @IsUUID()
  unitId: string;

  @IsString()
  @MinLength(1)
  guestName: string;

  @IsEnum(PassType)
  type: PassType;

  @IsDateString()
  validFrom: string;

  @IsDateString()
  validUntil: string;

  // Required for recurring passes only (0 = Sunday ... 6 = Saturday).
  @ValidateIf((dto: CreateGuestPassDto) => dto.type === PassType.recurring)
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  @Type(() => Number)
  daysOfWeek?: number[];

  @ValidateIf((dto: CreateGuestPassDto) => dto.type === PassType.recurring)
  @IsInt()
  @Min(0)
  @Max(1439)
  @Type(() => Number)
  dailyStartMin?: number;

  @ValidateIf((dto: CreateGuestPassDto) => dto.type === PassType.recurring)
  @IsInt()
  @Min(0)
  @Max(1439)
  @Type(() => Number)
  dailyEndMin?: number;
}
