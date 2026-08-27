import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({ example: 'atomic-habits' })
  @IsString()
  @IsNotEmpty()
  bookId: string;
}
