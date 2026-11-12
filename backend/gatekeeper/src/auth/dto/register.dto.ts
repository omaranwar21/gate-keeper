import { IsEmail, IsEnum, IsOptional, MinLength } from 'class-validator';
import { Role } from '../../users/role.enum';

export class RegisterDto {
  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsEnum(Role)
  role: Role;
}
