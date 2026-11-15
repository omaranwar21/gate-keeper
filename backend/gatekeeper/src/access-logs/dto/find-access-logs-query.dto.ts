import { IsIn, IsOptional, IsUUID, Matches } from 'class-validator';
import { ScanResult } from '../../generated/prisma/enums';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';

const CAIRO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class FindAccessLogsQueryDto extends PaginationQueryDto {
  // A Cairo-local calendar day, e.g. "2026-01-15" — not a full ISO instant.
  @IsOptional()
  @Matches(CAIRO_DATE_PATTERN, { message: 'date must be in YYYY-MM-DD format' })
  date?: string;

  @IsOptional()
  @IsUUID()
  buildingId?: string;

  @IsOptional()
  @IsUUID()
  unitId?: string;

  @IsOptional()
  @IsIn([ScanResult.allowed, ScanResult.denied])
  result?: ScanResult;
}
