import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  coverClassName?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: '/covers/books/laskar-pelangi.png',
    description: 'Absolute HTTP(S) URL or API-relative path to the book cover',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @Matches(/^(https?:\/\/|\/)/, {
    message: 'coverUrl must be an HTTP(S) URL or an API-relative path',
  })
  coverUrl?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    maxLength: 5000,
    example: 'A short synopsis of the book.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    minimum: 1,
    example: 320,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  pageCount?: number | null;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  authorId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiPropertyOptional({ minimum: 1, default: 1, example: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  totalCopies?: number;
}
