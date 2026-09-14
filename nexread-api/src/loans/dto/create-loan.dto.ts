import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLoanDto {
  @ApiProperty({ example: 'atomic-habits' })
  @IsString()
  @IsNotEmpty()
  bookId!: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Specific physical copy; defaults to the first available copy',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  bookCopyId?: number;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'Defaults to 14 days after borrowing',
  })
  @IsOptional()
  @IsDateString()
  dueAt?: string;
}
