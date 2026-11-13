import { IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUnitDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  number?: string;

  @IsOptional()
  @IsInt()
  floor?: number;
}
