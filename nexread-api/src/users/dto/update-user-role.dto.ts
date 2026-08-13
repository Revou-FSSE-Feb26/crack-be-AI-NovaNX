import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../generated/prisma/enums';

export class UpdateUserRoleDto {
  @ApiProperty({ enum: Role })
  @IsEnum(Role)
  role: Role;
}
