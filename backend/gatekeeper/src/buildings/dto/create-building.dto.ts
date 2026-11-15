import { IsString, MinLength } from 'class-validator';

export class CreateBuildingDto {
  @IsString()
  @MinLength(1)
  name: string;
}
