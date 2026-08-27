import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LoanStatus } from '../../../generated/prisma/enums';
import { BookDetailResponseDto } from '../../books/dto/book-response.dto';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class LoanResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  userId!: number;

  @ApiProperty({ example: 'atomic-habits' })
  bookId!: string;

  @ApiProperty({ enum: LoanStatus, example: LoanStatus.ACTIVE })
  status!: LoanStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  borrowedAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  dueAt!: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  returnedAt!: Date | null;

  @ApiProperty({ type: BookDetailResponseDto })
  book!: BookDetailResponseDto;
}

export class AdminLoanResponseDto extends LoanResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;
}
