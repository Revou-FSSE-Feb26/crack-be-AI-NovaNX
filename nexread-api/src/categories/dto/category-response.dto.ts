import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({ example: 'fiction' })
  id: string;

  @ApiProperty({ example: 'Fiction' })
  name: string;

  @ApiProperty({ example: 'fiction' })
  slug: string;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Explore fictional stories',
  })
  subtitle: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: '/assets/images/categories/fiction.svg',
  })
  iconPath: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
