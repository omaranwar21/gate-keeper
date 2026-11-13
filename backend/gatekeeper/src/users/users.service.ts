import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from './role.enum';
import { User } from './user.interface';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  create(
    email: string,
    hashedPassword: string,
    fullName: string,
    role: Role,
  ): Promise<User> {
    return this.prisma.user.create({
      data: { email, passwordHash: hashedPassword, fullName, role },
    });
  }
}
