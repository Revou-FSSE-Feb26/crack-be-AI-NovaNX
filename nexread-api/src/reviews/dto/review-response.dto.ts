import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
