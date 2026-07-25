import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { BooksRepository } from './repositories/books.repository';

@Injectable()
export class BooksService {
  constructor(private readonly booksRepository: BooksRepository) {}

  create(createBookDto: CreateBookDto) {
    return this.booksRepository.create(createBookDto);
  }

  findAll() {
    return this.booksRepository.findAll();
  }

  async findOne(id: string) {
    const book = await this.booksRepository.findById(id);

    if (!book) {
      throw new NotFoundException(`Book with id "${id}" not found`);
    }

    return book;
  }

  async update(id: string, updateBookDto: UpdateBookDto) {
    await this.findOne(id);
    return this.booksRepository.update(id, updateBookDto);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.booksRepository.delete(id);
  }
}
