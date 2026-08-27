import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { LoanStatus } from '../../../generated/prisma/enums';

export class AdminCreateLoanDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId: number;

  @ApiProperty({ example: 'atomic-habits' })
  @IsString()
  @IsNotEmpty()
  bookId: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  dueAt?: string;
}

export class AdminUpdateLoanDto {
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @ApiPropertyOptional({
    enum: [LoanStatus.RETURNED],
    description: 'Only RETURNED is accepted; returned loans cannot be reopened',
  })
  @IsOptional()
  @IsIn([LoanStatus.RETURNED])
  status?: LoanStatus;
}
