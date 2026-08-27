import { ApiProperty } from '@nestjs/swagger';

export class DashboardResponseDto {
  @ApiProperty({ example: 25 })
  users: number;

  @ApiProperty({ example: 12 })
  authors: number;

  @ApiProperty({ example: 8 })
  categories: number;

  @ApiProperty({ example: 40 })
  books: number;

  @ApiProperty({ example: 34 })
  availableBooks: number;

  @ApiProperty({ example: 6 })
  activeLoans: number;

  @ApiProperty({ example: 2 })
  overdueLoans: number;
}

export class AuthorStatisticResponseDto {
  @ApiProperty({ example: 'andrea-hirata' })
  id: string;

  @ApiProperty({ example: 'Andrea Hirata' })
  name: string;

  @ApiProperty({ example: 4 })
  booksCount: number;

  @ApiProperty({ example: 4.65 })
  averageBookRating: number;
}

export class CategoryStatisticResponseDto {
  @ApiProperty({ example: 'fiction' })
  id: string;

  @ApiProperty({ example: 'Fiction' })
  name: string;

  @ApiProperty({ example: 'fiction' })
  slug: string;

  @ApiProperty({ example: 7 })
  booksCount: number;
}
