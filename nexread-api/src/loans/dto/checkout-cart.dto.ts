import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt } from 'class-validator';

export class CheckoutCartDto {
  @ApiProperty({ enum: [3, 5, 10], example: 5 })
  @Type(() => Number)
  @IsInt()
  @IsIn([3, 5, 10])
  durationDays: 3 | 5 | 10;
}
