import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';

@Injectable()
export class AuthorsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createAuthorDto: CreateAuthorDto) {
    return this.prisma.author.create({ data: createAuthorDto });
  }

  findAll() {
    return this.prisma.author.findMany();
  }

  async findOne(id: string) {
    const author = await this.prisma.author.findUnique({ where: { id } });

    if (!author) {
      throw new NotFoundException(`Author with id "${id}" not found`);
    }

    return author;
  }

  async update(id: string, updateAuthorDto: UpdateAuthorDto) {
    await this.findOne(id);
    return this.prisma.author.update({
      where: { id },
      data: updateAuthorDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.author.delete({ where: { id } });
  }
}
