import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { mkdirSync } from 'node:fs';
import { Role } from '../../generated/prisma/enums';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { BooksService } from './books.service';
import {
  BookDetailResponseDto,
  PaginatedBooksResponseDto,
  BookResponseDto,
} from './dto/book-response.dto';
import { CreateBookDto } from './dto/create-book.dto';
import { QueryBooksDto } from './dto/query-books.dto';
import { UpdateBookDto } from './dto/update-book.dto';

const bookCoverUploadDir = 'public/covers/books';
const coverExtensionsByMimeType = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);
const bookCoverStorage = diskStorage({
  destination: (_request, _file, callback) => {
    mkdirSync(bookCoverUploadDir, { recursive: true });
    callback(null, bookCoverUploadDir);
  },
  filename: (_request, file, callback) => {
    const extension = coverExtensionsByMimeType.get(file.mimetype) ?? 'img';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    callback(null, `book-cover-${uniqueSuffix}.${extension}`);
  },
});

const BookCoverInterceptor = FileInterceptor('cover', {
  storage: bookCoverStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    if (!coverExtensionsByMimeType.has(file.mimetype)) {
      callback(
        new BadRequestException('cover must be a JPG, PNG, or WEBP image'),
        false,
      );
      return;
    }
    callback(null, true);
  },
});

@ApiTags('Books')
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a book (admin only)' })
  @ApiConsumes('application/json', 'multipart/form-data')
  @ApiBody({ type: CreateBookDto })
  @ApiCreatedResponse({
    description: 'Book created successfully',
    type: BookResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or an author/category does not exist',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Bearer token is missing or invalid',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Authenticated user is not an admin',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Book id already exists',
    type: ErrorResponseDto,
  })
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  @UseInterceptors(BookCoverInterceptor)
  create(
    @Body() createBookDto: CreateBookDto,
    @UploadedFile() cover?: Express.Multer.File,
  ) {
    return this.booksService.create(
      createBookDto,
      cover ? `/covers/books/${cover.filename}` : undefined,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List all books with author and category' })
  @ApiOkResponse({
    description: 'Books returned successfully',
    type: PaginatedBooksResponseDto,
  })
  findAll(@Query() query: QueryBooksDto) {
    return this.booksService.findAll(query);
  }

  @Get('recommend')
  @ApiOperation({ summary: 'Get top-rated book recommendations' })
  @ApiOkResponse({ type: PaginatedBooksResponseDto })
  findRecommended(@Query() query: QueryBooksDto) {
    return this.booksService.findRecommended(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a book with author and category by id' })
  @ApiOkResponse({
    description: 'Book returned successfully',
    type: BookDetailResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Book was not found',
    type: ErrorResponseDto,
  })
  findOne(@Param('id') id: string) {
    return this.booksService.findOne(id);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a book or upload its cover image (admin only)',
  })
  @ApiConsumes('application/json', 'multipart/form-data')
  @ApiBody({ type: UpdateBookDto })
  @ApiOkResponse({
    description: 'Book updated successfully',
    type: BookResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or an author/category does not exist',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Bearer token is missing or invalid',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Authenticated user is not an admin',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Book was not found',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Total copies would be lower than active loans',
    type: ErrorResponseDto,
  })
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(BookCoverInterceptor)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBookDto: UpdateBookDto,
    @UploadedFile() cover?: Express.Multer.File,
  ) {
    return this.booksService.update(
      id,
      updateBookDto,
      cover ? `/covers/books/${cover.filename}` : undefined,
    );
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete/archive a book when it has no active loans (admin only)',
  })
  @ApiOkResponse({
    description: 'Deleted book',
    type: BookResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Bearer token is missing or invalid',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Authenticated user is not an admin',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Book was not found',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Book still has one or more active loans',
    type: ErrorResponseDto,
  })
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.booksService.remove(id);
  }
}
