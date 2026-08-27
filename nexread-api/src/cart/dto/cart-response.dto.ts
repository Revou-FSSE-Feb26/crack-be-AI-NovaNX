import { ApiProperty } from '@nestjs/swagger';
import { BookListItemResponseDto } from '../../books/dto/book-response.dto';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class CartItemResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: 'atomic-habits' })
  bookId: string;

  @ApiProperty({ type: BookListItemResponseDto })
  book: BookListItemResponseDto;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}

export class CheckoutResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({ type: [CartItemResponseDto] })
  items: CartItemResponseDto[];

  @ApiProperty({ example: 2 })
  totalItems: number;
}
