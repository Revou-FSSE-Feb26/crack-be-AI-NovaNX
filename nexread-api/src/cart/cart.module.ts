import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { CartRepository } from './repositories/cart.repository';
import { PrismaCartRepository } from './repositories/prisma-cart.repository';

@Module({
  controllers: [CartController],
  providers: [
    CartService,
    { provide: CartRepository, useClass: PrismaCartRepository },
  ],
})
export class CartModule {}
