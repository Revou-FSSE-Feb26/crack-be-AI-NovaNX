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
