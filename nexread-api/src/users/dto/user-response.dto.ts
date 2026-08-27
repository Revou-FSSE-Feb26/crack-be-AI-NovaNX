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

export class LoanStatisticsResponseDto {
  @ApiProperty({ example: 8 })
  total: number;

  @ApiProperty({ example: 2 })
  active: number;

  @ApiProperty({ example: 6 })
  returned: number;

  @ApiProperty({ example: 1 })
  overdue: number;
}

export class MeProfileResponseDto extends UserResponseDto {
  @ApiProperty({ type: LoanStatisticsResponseDto })
  loanStatistics: LoanStatisticsResponseDto;
}

export class UserPaginationMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 24 })
  total: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

export class PaginatedUsersResponseDto {
  @ApiProperty({ type: [UserResponseDto] })
  data: UserResponseDto[];

  @ApiProperty({ type: UserPaginationMetaDto })
  meta: UserPaginationMetaDto;
}
