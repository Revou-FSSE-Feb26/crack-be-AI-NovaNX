import { ApiProperty } from '@nestjs/swagger';

export class AuthorResponseDto {
  @ApiProperty({ example: 'andrea-hirata' })
  id: string;

  @ApiProperty({ example: 'Andrea Hirata' })
  name: string;

  @ApiProperty({ minimum: 0, example: 12 })
  booksCount: number;

  @ApiProperty({ minimum: 0, example: 8400 })
  borrowedBooksCount: number;

  @ApiProperty({ minimum: 0, maximum: 5, example: 4.9 })
  rating: number;

  @ApiProperty({
    type: String,
    nullable: true,
    example: '/assets/images/authors/andrea-hirata.svg',
  })
  avatarPath: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class PopularAuthorResponseDto extends AuthorResponseDto {
  @ApiProperty({ minimum: 0, example: 24 })
  reviewCount: number;

  @ApiProperty({ minimum: 0, example: 125 })
  borrowCount: number;

  @ApiProperty({ minimum: 0, maximum: 5, example: 4.7 })
  averageBookRating: number;

  @ApiProperty({ minimum: 0, example: 38.14 })
  popularityScore: number;
}

export class AuthorPaginationMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 24 })
  total: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

export class PaginatedAuthorsResponseDto {
  @ApiProperty({ type: [AuthorResponseDto] })
  data: AuthorResponseDto[];

  @ApiProperty({ type: AuthorPaginationMetaDto })
  meta: AuthorPaginationMetaDto;
}

export class PaginatedPopularAuthorsResponseDto {
  @ApiProperty({ type: [PopularAuthorResponseDto] })
  data: PopularAuthorResponseDto[];

  @ApiProperty({ type: AuthorPaginationMetaDto })
  meta: AuthorPaginationMetaDto;
}
