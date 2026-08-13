import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'NexRead User' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ format: 'email', example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ minLength: 8, example: 'strong-password' })
  @IsString()
  @MinLength(8)
  password: string;
}
