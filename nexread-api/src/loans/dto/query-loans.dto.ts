import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum LoanFilter {
  ALL = 'ALL',
  ACTIVE = 'ACTIVE',
  RETURNED = 'RETURNED',
  OVERDUE = 'OVERDUE',
}

export class QueryLoansDto {
  @ApiPropertyOptional({ enum: LoanFilter, default: LoanFilter.ALL })
  @IsOptional()
  @IsEnum(LoanFilter)
  status?: LoanFilter;

  @ApiPropertyOptional({
    description: 'Search book title, or user name/email on admin routes',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
