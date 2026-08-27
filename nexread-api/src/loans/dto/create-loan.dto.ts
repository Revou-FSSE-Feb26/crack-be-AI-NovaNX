import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateLoanDto {
  @ApiProperty({ example: 'atomic-habits' })
  @IsString()
  @IsNotEmpty()
  bookId!: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'Defaults to 14 days after borrowing',
  })
  @IsOptional()
  @IsDateString()
  dueAt?: string;
}
