import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../generated/prisma/enums';

export class UserResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'NexRead User' })
  fullName: string;

  @ApiProperty({ format: 'email', example: 'user@example.com' })
  email: string;

  @ApiProperty({ enum: Role, enumName: 'Role', example: Role.USER })
  role: Role;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
