import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateBookCopyDto {
  @ApiProperty({ example: 'white-fang' })
  @IsString()
  @IsNotEmpty()
  bookId!: string;

  @ApiProperty({ example: 'NXR-WHITE-FANG-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, {
    message:
      'barcode may only contain letters, numbers, dots, underscores, and hyphens',
  })
  barcode!: string;

  @ApiPropertyOptional({ example: 'F-03' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  shelfCode?: string;
}
