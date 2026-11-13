import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { Role } from '../../users/role.enum';

export class RegisterDto {
  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(2)
  fullName: string;

  @IsEnum(Role)
  role: Role;
}
