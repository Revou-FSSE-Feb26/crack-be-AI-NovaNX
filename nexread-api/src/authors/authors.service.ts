import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { AuthorsRepository } from './repositories/authors.repository';

@Injectable()
export class AuthorsService {
  constructor(private readonly authorsRepository: AuthorsRepository) {}

  create(createAuthorDto: CreateAuthorDto) {
    return this.authorsRepository.create(createAuthorDto);
  }

  findAll() {
    return this.authorsRepository.findAll();
  }

  async findOne(id: string) {
    const author = await this.authorsRepository.findById(id);

    if (!author) {
      throw new NotFoundException(`Author with id "${id}" not found`);
    }

    return author;
  }

  async update(id: string, updateAuthorDto: UpdateAuthorDto) {
    await this.findOne(id);
    return this.authorsRepository.update(id, updateAuthorDto);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.authorsRepository.delete(id);
  }
}
