import {
  Allow,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * Fields an authenticated user may update through `PATCH /me`. Password and
 * role changes use dedicated endpoints so they cannot be mass-assigned with
 * ordinary profile fields.
 */
export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  fullName?: string;

  @ApiPropertyOptional({ format: 'email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: '+6281234567890',
    description:
      'Phone number in international format (for example +628...) or local format beginning with 0',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (value === '' ? null : value))
  @IsString()
  @MaxLength(16)
  @Matches(/^(?:\+[1-9]\d{7,14}|0\d{8,14})$/, {
    message:
      'phoneNumber must use international format (for example +628...) or local format beginning with 0',
  })
  phoneNumber?: string | null;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description:
      'Avatar image file. Supported formats: JPG, PNG, WEBP, and GIF. Maximum size: 5 MB.',
  })
  @IsOptional()
  @Allow()
  avatar?: unknown;
}
