import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBookDto } from './dto/create-book.dto';
import { QueryBooksDto } from './dto/query-books.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { BooksRepository } from './repositories/books.repository';

@Injectable()
export class BooksService {
  constructor(private readonly booksRepository: BooksRepository) {}

  create(createBookDto: CreateBookDto) {
    return this.booksRepository.create(createBookDto);
  }

  async findAll(query: QueryBooksDto = new QueryBooksDto()) {
    return this.toPaginatedResponse(await this.booksRepository.findAll(query));
  }

  async findRecommended(query: QueryBooksDto = new QueryBooksDto()) {
    return this.toPaginatedResponse(
      await this.booksRepository.findRecommended(query),
    );
  }

  async findOne(id: string) {
    const book = await this.booksRepository.findById(id);

    if (!book) {
      throw new NotFoundException(`Book with id "${id}" not found`);
    }

    const result = book as { _count?: { reviews: number } } & Record<
      string,
      unknown
    >;
    const { _count, ...detail } = result;
    return { ...detail, reviewCount: _count?.reviews ?? 0 };
  }

  async update(id: string, updateBookDto: UpdateBookDto) {
    await this.findOne(id);

    if (updateBookDto.totalCopies !== undefined) {
      const activeLoans = await this.booksRepository.countActiveLoans(id);
      if (updateBookDto.totalCopies < activeLoans) {
        throw new ConflictException(
          `totalCopies cannot be lower than ${activeLoans} active loans`,
        );
      }
    }

    return this.booksRepository.update(id, updateBookDto);
  }

  async remove(id: string) {
    await this.findOne(id);
    const activeLoans = await this.booksRepository.countActiveLoans(id);
    if (activeLoans > 0) {
      throw new ConflictException(
        'Book cannot be deleted while loans are active',
      );
    }
    return this.booksRepository.deleteOrArchive(id);
  }

  private toPaginatedResponse(result: {
    data: unknown[];
    total: number;
    page: number;
    limit: number;
  }) {
    return {
      data: result.data,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }
}
