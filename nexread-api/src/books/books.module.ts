import { Module } from '@nestjs/common';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { BooksRepository } from './repositories/books.repository';
import { PrismaBooksRepository } from './repositories/prisma-books.repository';

@Module({
  controllers: [BooksController],
  providers: [
    BooksService,
    { provide: BooksRepository, useClass: PrismaBooksRepository },
  ],
})
export class BooksModule {}
