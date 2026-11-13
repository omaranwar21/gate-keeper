import { IsInt, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateUnitDto {
  @IsUUID()
  buildingId: string;

  @IsString()
  @MinLength(1)
  number: string;

  @IsOptional()
  @IsInt()
  floor?: number;
}
