import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '../users/role.enum';
import { User } from '../users/user.interface';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async createUser(dto: RegisterDto): Promise<Omit<User, 'passwordHash'>> {
    if (await this.usersService.findByEmail(dto.email)) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.usersService.create(
      dto.email,
      hashedPassword,
      dto.fullName,
      dto.role,
    );

    const { passwordHash: _passwordHash, ...result } = user;
    return result;
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return null;
    }

    const { passwordHash: _passwordHash, ...result } = user;
    return result;
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ accessToken: string }> {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    return { accessToken: await this.jwtService.signAsync(payload) };
  }
}
