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
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBookDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  authorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  categoryId?: string;

  @ApiPropertyOptional({ minimum: 1, example: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  totalCopies?: number;
}
