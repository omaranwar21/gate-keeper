import { Body, Controller, Post } from '@nestjs/common';
import { RegisterDto } from '../auth/dto/register.dto';
import { AuthService } from '../auth/auth.service';

@Controller('users')
export class UsersController {
  constructor(private readonly authService: AuthService) {}

  @Post('create')
  register(@Body() dto: RegisterDto) {
    return this.authService.createUser(dto);
  }
}
