import { ApiProperty } from '@nestjs/swagger';
import { AuthorResponseDto } from '../../authors/dto/author-response.dto';
import { CategoryResponseDto } from '../../categories/dto/category-response.dto';

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

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class BookDetailResponseDto extends BookResponseDto {
  @ApiProperty({ type: AuthorResponseDto })
  author: AuthorResponseDto;

  @ApiProperty({ type: CategoryResponseDto })
  category: CategoryResponseDto;
}
