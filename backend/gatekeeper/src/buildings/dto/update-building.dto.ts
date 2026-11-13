import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateBuildingDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;
}
