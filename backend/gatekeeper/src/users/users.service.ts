import { Injectable } from '@nestjs/common';
import { Role } from './role.enum';
import { User } from './user.interface';

@Injectable()
export class UsersService {
  private readonly users: User[] = [];
  private nextId = 1;

  findByEmail(email: string): User | undefined {
    return this.users.find((user) => user.email === email);
  }

  create(email: string, hashedPassword: string, role: Role): User {
    const user: User = {
      id: this.nextId++,
      email,
      password: hashedPassword,
      role,
    };
    this.users.push(user);
    return user;
  }
}
