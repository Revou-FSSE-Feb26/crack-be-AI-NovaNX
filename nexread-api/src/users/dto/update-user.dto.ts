import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Fields a user is allowed to self-update (or an admin may update on their
 * behalf). `role` is intentionally excluded here — it is never accepted
 * through this DTO, even for admins, to avoid privilege-escalation via mass
 * assignment. Role changes go through the dedicated `PATCH /users/:id/role`
 * endpoint instead.
 */
export class UpdateUserDto {
  @ApiPropertyOptional({ format: 'email' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  fullName?: string;

  @ApiPropertyOptional({ minLength: 8 })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
