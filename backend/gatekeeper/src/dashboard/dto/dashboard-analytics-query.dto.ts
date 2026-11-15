import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class DashboardAnalyticsQueryDto {
  // How many trailing days (including today) the trend/building/hour
  // breakdowns cover. Capped well above any reasonable dashboard window.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(180)
  days?: number;
}
