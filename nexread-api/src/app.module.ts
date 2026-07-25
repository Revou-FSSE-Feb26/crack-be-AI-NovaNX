import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthorsModule } from './authors/authors.module';
import { CategoriesModule } from './categories/categories.module';
import { BooksModule } from './books/books.module';

@Module({
  imports: [PrismaModule, AuthorsModule, CategoriesModule, BooksModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
