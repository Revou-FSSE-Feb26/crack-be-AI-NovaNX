import { BadRequestException } from '@nestjs/common';
import { access, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';

describe('BooksController', () => {
  const createBook = jest.fn();
  const updateBook = jest.fn();
  const booksService = {
    create: createBook,
    update: updateBook,
  } as unknown as BooksService;
  const controller = new BooksController(booksService);

  beforeEach(() => jest.clearAllMocks());

  it('passes an uploaded cover path to the update service', async () => {
    const update = { title: 'Updated title' };
    const cover = { filename: 'book-cover-1-2.png' } as Express.Multer.File;

    await controller.update('book-1', update, cover);

    expect(updateBook).toHaveBeenCalledWith(
      'book-1',
      update,
      '/covers/books/book-cover-1-2.png',
    );
  });

  it('removes a newly uploaded cover when persistence fails', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'nexread-book-cover-'));
    const path = join(directory, 'cover.png');
    await writeFile(path, 'image');
    createBook.mockRejectedValueOnce(new BadRequestException('invalid author'));

    await expect(
      controller.create(
        {
          id: 'book-1',
          title: 'Book One',
          authorId: 'missing',
          categoryId: 'fiction',
        },
        { filename: 'cover.png', path } as Express.Multer.File,
      ),
    ).rejects.toThrow(BadRequestException);
    await expect(access(path)).rejects.toThrow();
    await rm(directory, { recursive: true });
  });
});
