import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '../../generated/prisma/enums';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewsRepository } from './repositories/reviews.repository';

@Injectable()
export class ReviewsService {
  constructor(private readonly reviewsRepository: ReviewsRepository) {}

  async findByBook(bookId: string) {
    await this.findBookOrThrow(bookId);
    return this.reviewsRepository.findByBook(bookId);
  }

  async create(userId: number, bookId: string, data: CreateReviewDto) {
    await this.findBookOrThrow(bookId);
    const existing = await this.reviewsRepository.findByUserAndBook(
      userId,
      bookId,
    );
    if (existing) {
      throw new ConflictException('You have already reviewed this book');
    }
    return this.reviewsRepository.create(userId, bookId, data);
  }

  async update(userId: number, role: Role, id: number, data: UpdateReviewDto) {
    const review = await this.findReviewOrThrow(id);
    this.assertOwnerOrAdmin(userId, role, review.userId);
    return this.reviewsRepository.update(id, data);
  }

  async remove(userId: number, role: Role, id: number) {
    const review = await this.findReviewOrThrow(id);
    this.assertOwnerOrAdmin(userId, role, review.userId);
    return this.reviewsRepository.delete(id);
  }

  private async findBookOrThrow(bookId: string) {
    const book = await this.reviewsRepository.findBookById(bookId);
    if (!book)
      throw new NotFoundException(`Book with id "${bookId}" not found`);
    return book;
  }

  private async findReviewOrThrow(id: number) {
    const review = await this.reviewsRepository.findById(id);
    if (!review)
      throw new NotFoundException(`Review with id "${id}" not found`);
    return review;
  }

  private assertOwnerOrAdmin(userId: number, role: Role, ownerId: number) {
    if (userId !== ownerId && role !== Role.ADMIN) {
      throw new ForbiddenException('You can only modify your own review');
    }
  }
}
