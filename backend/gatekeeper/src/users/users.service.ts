import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from './role.enum';
import { User } from './user.interface';
import { PaginateOptions, paginator } from '../shared/utils/pagination';

const paginate = paginator({ perPage: 10 });

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(role?: Role, options?: PaginateOptions) {
    return paginate(
      this.prisma.user,
      {
        where: role ? { role } : undefined,
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { fullName: 'asc' },
      },
      options,
    );
  }

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
