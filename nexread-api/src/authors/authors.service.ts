import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BooksService } from '../books/books.service';
import { QueryBooksDto } from '../books/dto/query-books.dto';
import { CreateAuthorDto } from './dto/create-author.dto';
import {
  QueryAuthorsDto,
  QueryPopularAuthorsDto,
} from './dto/query-authors.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { AuthorsRepository } from './repositories/authors.repository';

@Injectable()
export class AuthorsService {
  constructor(
    private readonly authorsRepository: AuthorsRepository,
    private readonly booksService: BooksService,
  ) {}

  async create(createAuthorDto: CreateAuthorDto) {
    return this.toPublicAuthor(
      await this.authorsRepository.create(createAuthorDto),
    );
  }

  async findAll(query: QueryAuthorsDto = new QueryAuthorsDto()) {
    return this.toPaginatedResponse(
      await this.authorsRepository.findAll(query),
    );
  }

  async findPopular(
    query: QueryPopularAuthorsDto = new QueryPopularAuthorsDto(),
  ) {
    return this.toPaginatedResponse(
      await this.authorsRepository.findPopular(query),
    );
  }

  async findBooks(id: string, query: QueryBooksDto) {
    await this.findOne(id);
    return this.booksService.findAll({ ...query, authorId: id });
  }

  async findOne(id: string) {
    const author = await this.authorsRepository.findById(id);

    if (!author) {
      throw new NotFoundException(`Author with id "${id}" not found`);
    }

    return this.toPublicAuthor(author);
  }

  async update(id: string, updateAuthorDto: UpdateAuthorDto) {
    await this.findOne(id);
    return this.toPublicAuthor(
      await this.authorsRepository.update(id, updateAuthorDto),
    );
  }

  async remove(id: string) {
    await this.findOne(id);
    const visibleBooks = await this.authorsRepository.countVisibleBooks(id);
    if (visibleBooks > 0) {
      throw new ConflictException(
        'Author cannot be deleted while books are still associated',
      );
    }
    return this.toPublicAuthor(
      await this.authorsRepository.deleteOrArchive(id),
    );
  }

  private toPaginatedResponse(result: {
    data: Array<{ deletedAt?: Date | null }>;
    total: number;
    page: number;
    limit: number;
  }) {
    return {
      data: result.data.map((author) => this.toPublicAuthor(author)),
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  private toPublicAuthor<T extends { deletedAt?: Date | null }>(author: T) {
    const publicAuthor = { ...author };
    delete publicAuthor.deletedAt;
    return publicAuthor;
  }
}
