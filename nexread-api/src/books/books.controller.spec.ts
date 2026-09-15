import { BooksController } from './books.controller';
import { BooksService } from './books.service';

describe('BooksController', () => {
  const updateBook = jest.fn();
  const booksService = {
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
});
