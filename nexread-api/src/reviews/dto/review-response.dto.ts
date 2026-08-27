import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookListItemResponseDto } from '../../books/dto/book-response.dto';

export class ReviewUserResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'NexRead User' })
  fullName: string;
}

export class ReviewResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: 'atomic-habits' })
  bookId: string;

  @ApiProperty({ minimum: 1, maximum: 5, example: 5 })
  rating: number;

  @ApiPropertyOptional({ nullable: true, example: 'Sangat menarik.' })
  comment: string | null;

  @ApiProperty({ type: ReviewUserResponseDto })
  user: ReviewUserResponseDto;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class MyReviewResponseDto extends ReviewResponseDto {
  @ApiProperty({ type: () => BookListItemResponseDto })
  book: BookListItemResponseDto;
}

export class ReviewPaginationMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 8 })
  total: number;

  @ApiProperty({ example: 1 })
  totalPages: number;
}

export class PaginatedMyReviewsResponseDto {
  @ApiProperty({ type: [MyReviewResponseDto] })
  data: MyReviewResponseDto[];

  @ApiProperty({ type: ReviewPaginationMetaDto })
  meta: ReviewPaginationMetaDto;
}
