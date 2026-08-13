import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../generated/prisma/enums';

export class AuthUserResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'NexRead User' })
  fullName: string;

  @ApiProperty({ format: 'email', example: 'user@example.com' })
  email: string;

  @ApiProperty({ enum: Role, enumName: 'Role', example: Role.USER })
  role: Role;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token for the Authorization Bearer header',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Single-use rotating token for POST /auth/refresh',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({ type: AuthUserResponseDto })
  user: AuthUserResponseDto;
}
