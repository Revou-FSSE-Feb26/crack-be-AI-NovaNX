import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LoanStatus } from '../../../generated/prisma/enums';
import { BookListItemResponseDto } from '../../books/dto/book-response.dto';
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

  @ApiProperty({ type: BookListItemResponseDto })
  book!: BookListItemResponseDto;
}

export class AdminLoanResponseDto extends LoanResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;
}

export class LoanPaginationMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 24 })
  total: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

export class PaginatedLoansResponseDto {
  @ApiProperty({ type: [LoanResponseDto] })
  data: LoanResponseDto[];

  @ApiProperty({ type: LoanPaginationMetaDto })
  meta: LoanPaginationMetaDto;
}

export class PaginatedAdminLoansResponseDto {
  @ApiProperty({ type: [AdminLoanResponseDto] })
  data: AdminLoanResponseDto[];

  @ApiProperty({ type: LoanPaginationMetaDto })
  meta: LoanPaginationMetaDto;
}
