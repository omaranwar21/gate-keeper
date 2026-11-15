import { IsUUID } from 'class-validator';

export class AssignResidentDto {
  @IsUUID()
  userId: string;
}
