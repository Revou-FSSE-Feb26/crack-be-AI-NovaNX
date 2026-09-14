import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { BookCopyStatus } from '../../../generated/prisma/enums';

export class UpdateBookCopyStatusDto {
  @ApiProperty({
    enum: [
      BookCopyStatus.AVAILABLE,
      BookCopyStatus.DAMAGED,
      BookCopyStatus.LOST,
      BookCopyStatus.ARCHIVED,
    ],
    description: 'LOANED is managed exclusively by the loan workflow',
  })
  @IsEnum(BookCopyStatus)
  status!: BookCopyStatus;

  @ApiPropertyOptional({ example: 'F-03', nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  shelfCode?: string | null;

  @ApiPropertyOptional({
    example: 'Cover torn during inspection',
    description: 'Reason recorded in the copy status audit history',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  note?: string;
}
