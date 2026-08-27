import { ApiProperty } from '@nestjs/swagger';
import { AuthorResponseDto } from '../../authors/dto/author-response.dto';
import { CategoryResponseDto } from '../../categories/dto/category-response.dto';
import { ReviewResponseDto } from '../../reviews/dto/review-response.dto';

export class BookResponseDto {
  @ApiProperty({ example: 'laskar-pelangi' })
  id: string;

  @ApiProperty({ example: 'Laskar Pelangi' })
  title: string;

  @ApiProperty({ minimum: 0, maximum: 5, example: 4.8 })
  rating: number;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'bg-gradient-to-br from-blue-500 to-indigo-700',
  })
  coverClassName: string | null;

  @ApiProperty({ example: 'andrea-hirata' })
  authorId: string;

  @ApiProperty({ example: 'fiction' })
  categoryId: string;

  @ApiProperty({ example: true })
  isAvailable: boolean;

  @ApiProperty({ minimum: 1, example: 3 })
  totalCopies: number;

  @ApiProperty({ minimum: 0, example: 2 })
  availableCopies: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class BookListItemResponseDto extends BookResponseDto {
  @ApiProperty({ type: AuthorResponseDto })
  author: AuthorResponseDto;

  @ApiProperty({ type: CategoryResponseDto })
  category: CategoryResponseDto;
}

export class BookDetailResponseDto extends BookListItemResponseDto {
  @ApiProperty({ example: 12 })
  reviewCount: number;

  @ApiProperty({ type: () => [ReviewResponseDto] })
  reviews: ReviewResponseDto[];
}

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

export class PaginatedBooksResponseDto {
  @ApiProperty({ type: [BookListItemResponseDto] })
  data: BookListItemResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
