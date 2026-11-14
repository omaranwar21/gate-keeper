import { IsString, MinLength } from 'class-validator';

export class ScanPassDto {
  @IsString()
  @MinLength(1)
  token: string;
}
