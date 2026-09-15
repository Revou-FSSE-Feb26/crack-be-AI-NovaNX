import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { unlink } from 'node:fs/promises';
import request from 'supertest';
import { App } from 'supertest/types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { BooksRepository } from './repositories/books.repository';
import { CreateBookDto } from './dto/create-book.dto';

describe('Create book multipart upload', () => {
  let app: INestApplication<App>;
  const paths: string[] = [];
  const create = jest.fn((data: CreateBookDto) => {
    if (data.coverUrl?.startsWith('/covers/books/book-cover-')) {
      paths.push(`public${data.coverUrl}`);
    }
    return data;
  });
  const fields = {
    id: 'upload-test',
    title: 'Upload test',
    authorId: 'author',
    categoryId: 'category',
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [BooksController],
      providers: [
        BooksService,
        { provide: BooksRepository, useValue: { create } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await Promise.all(paths.map((path) => unlink(path)));
  });

  it('uploads a cover and converts multipart numeric fields before persistence', async () => {
    const response = await request(app.getHttpServer())
      .post('/books')
      .field(fields)
      .field('pageCount', '320')
      .field('totalCopies', '3')
      .field('rating', '4.5')
      .field('coverUrl', 'https://example.com/old.png')
      .attach(
        'cover',
        Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
          'base64',
        ),
        { filename: 'cover.png', contentType: 'image/png' },
      )
      .expect(201);
    expect(response.body).toMatchObject({
      ...fields,
      pageCount: 320,
      totalCopies: 3,
      rating: 4.5,
    });
    expect((response.body as CreateBookDto).coverUrl).toMatch(
      /^\/covers\/books\/book-cover-.*\.png$/,
    );
    expect(create.mock.calls.at(-1)?.[0]).not.toHaveProperty('cover');
  });

  it('continues accepting JSON with a cover URL', async () => {
    await request(app.getHttpServer())
      .post('/books')
      .send({ ...fields, coverUrl: 'https://example.com/cover.jpg' })
      .expect(201)
      .expect(({ body }: { body: CreateBookDto }) => {
        expect(body.coverUrl).toBe('https://example.com/cover.jpg');
      });
  });

  it('rejects unsupported files', async () => {
    await request(app.getHttpServer())
      .post('/books')
      .field(fields)
      .attach('cover', Buffer.from('text'), {
        filename: 'cover.txt',
        contentType: 'text/plain',
      })
      .expect(400);
  });

  it('rejects files over 5 MB', async () => {
    await request(app.getHttpServer())
      .post('/books')
      .field(fields)
      .attach('cover', Buffer.alloc(5 * 1024 * 1024 + 1), {
        filename: 'cover.png',
        contentType: 'image/png',
      })
      .expect(413);
  });

  it('rejects invalid numeric multipart fields', async () => {
    await request(app.getHttpServer())
      .post('/books')
      .field(fields)
      .field('pageCount', 'invalid')
      .expect(400);
  });
});
