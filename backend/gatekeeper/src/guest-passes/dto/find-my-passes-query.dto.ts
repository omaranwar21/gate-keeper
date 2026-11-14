import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';
import { PASS_STATUSES, type PassStatus } from '../pass-validation';

export class FindMyPassesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(PASS_STATUSES)
  status?: PassStatus;

  // Passes whose validity window overlaps today (Africa/Cairo).
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  today?: boolean;
}
