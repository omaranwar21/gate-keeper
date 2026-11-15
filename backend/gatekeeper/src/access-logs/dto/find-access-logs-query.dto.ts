import { IsIn, IsISO8601, IsOptional, IsUUID } from 'class-validator';
import { ScanResult } from '../../generated/prisma/enums';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';

export class FindAccessLogsQueryDto extends PaginationQueryDto {
  // ISO instants bounding scannedAt (inclusive) — the frontend combines a
  // picked date + time into these.
  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

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
