import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { BookCopyStatus } from '../../../generated/prisma/enums';

export class QueryBookCopiesDto {
  @ApiPropertyOptional({ example: 'white-fang' })
  @IsOptional()
  @IsString()
  bookId?: string;

  @ApiPropertyOptional({ enum: BookCopyStatus })
  @IsOptional()
  @IsEnum(BookCopyStatus)
  status?: BookCopyStatus;

  @ApiPropertyOptional({
    description: 'Search barcode, shelf code, or book title',
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
