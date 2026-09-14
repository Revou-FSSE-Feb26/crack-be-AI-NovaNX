import { Module } from '@nestjs/common';
import { LoansModule } from '../loans/loans.module';
import { BookCopiesController } from './book-copies.controller';
import { BookCopiesService } from './book-copies.service';

@Module({
  imports: [LoansModule],
  controllers: [BookCopiesController],
  providers: [BookCopiesService],
})
export class BookCopiesModule {}
