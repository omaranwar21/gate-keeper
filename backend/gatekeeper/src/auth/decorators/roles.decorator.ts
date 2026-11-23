import { SetMetadata } from '@nestjs/common';
import { Role } from '../../users/role.enum';

export const ROLE_KEY = 'role';
export const PermittedRole = (...roles: Role[]) => SetMetadata(ROLE_KEY, roles);
