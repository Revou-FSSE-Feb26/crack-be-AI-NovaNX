import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import {
  CartItemResponseDto,
  CheckoutResponseDto,
} from './dto/cart-response.dto';

@ApiTags('Cart')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: ErrorResponseDto })
@UseGuards(JwtAuthGuard)
@Controller('api/cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({
    summary: 'My cart — daftar buku di cart (untuk halaman My Cart)',
  })
  @ApiOkResponse({ type: [CartItemResponseDto] })
  findMine(@Req() request: AuthenticatedRequest) {
    return this.cartService.findMine(request.user.userId);
  }

  @Get('checkout')
  @ApiOperation({
    summary:
      'Checkout payload — User Information + Book List (untuk halaman Checkout)',
  })
  @ApiOkResponse({ type: CheckoutResponseDto })
  checkout(@Req() request: AuthenticatedRequest) {
    return this.cartService.getCheckout(request.user.userId);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add book to cart (untuk pinjam nanti)' })
  @ApiCreatedResponse({ type: CartItemResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  add(@Req() request: AuthenticatedRequest, @Body() data: AddCartItemDto) {
    return this.cartService.add(request.user.userId, data);
  }

  @Delete('items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  remove(
    @Req() request: AuthenticatedRequest,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.cartService.remove(request.user.userId, itemId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear my cart' })
  @ApiNoContentResponse()
  clear(@Req() request: AuthenticatedRequest) {
    return this.cartService.clear(request.user.userId);
  }
}
