import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookCopyStatus, LoanStatus } from '../../../generated/prisma/enums';

class BookCopyBookDto {
  @ApiProperty({ example: 'white-fang' })
  id!: string;

  @ApiProperty({ example: 'White Fang' })
  title!: string;
}

class BookCopyBorrowerDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Library Member' })
  fullName!: string;

  @ApiProperty({ example: 'member@example.com' })
  email!: string;
}

class ActiveCopyLoanDto {
  @ApiProperty({ example: 10 })
  id!: number;

  @ApiProperty({ enum: LoanStatus, example: LoanStatus.ACTIVE })
  status!: LoanStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  borrowedAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  dueAt!: Date;

  @ApiProperty({ type: BookCopyBorrowerDto })
  user!: BookCopyBorrowerDto;
}

export class BookCopyResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'white-fang' })
  bookId!: string;

  @ApiProperty({ example: 'BK-001' })
  barcode!: string;

  @ApiProperty({ enum: BookCopyStatus })
  status!: BookCopyStatus;

  @ApiPropertyOptional({ example: 'F-03', nullable: true })
  shelfCode!: string | null;

  @ApiProperty({ type: BookCopyBookDto })
  book!: BookCopyBookDto;

  @ApiPropertyOptional({ type: ActiveCopyLoanDto, nullable: true })
  activeLoan!: ActiveCopyLoanDto | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

class BookCopyPaginationMetaDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 20 })
  total!: number;

  @ApiProperty({ example: 2 })
  totalPages!: number;
}

export class PaginatedBookCopiesResponseDto {
  @ApiProperty({ type: [BookCopyResponseDto] })
  data!: BookCopyResponseDto[];

  @ApiProperty({ type: BookCopyPaginationMetaDto })
  meta!: BookCopyPaginationMetaDto;
}

class BookCopyAuditActorDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Library Admin' })
  fullName!: string;

  @ApiProperty({ example: 'admin@example.com' })
  email!: string;
}

export class BookCopyAuditLogResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 4 })
  bookCopyId!: number;

  @ApiProperty({ enum: BookCopyStatus })
  previousStatus!: BookCopyStatus;

  @ApiProperty({ enum: BookCopyStatus })
  newStatus!: BookCopyStatus;

  @ApiPropertyOptional({ nullable: true, example: 'Cover torn' })
  note!: string | null;

  @ApiProperty({ type: BookCopyAuditActorDto })
  actorAdmin!: BookCopyAuditActorDto;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
