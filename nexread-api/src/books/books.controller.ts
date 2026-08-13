import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '../../generated/prisma/enums';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { BooksService } from './books.service';
import {
  BookDetailResponseDto,
  BookResponseDto,
} from './dto/book-response.dto';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@ApiTags('books')
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a book (admin only)' })
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
  create(@Body() createBookDto: CreateBookDto) {
    return this.booksService.create(createBookDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all books with author and category' })
  @ApiOkResponse({
    description: 'Books returned successfully',
    type: [BookDetailResponseDto],
  })
  findAll() {
    return this.booksService.findAll();
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
  @ApiOperation({ summary: 'Update a book (admin only)' })
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
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBookDto: UpdateBookDto) {
    return this.booksService.update(id, updateBookDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a book (admin only)' })
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
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.booksService.remove(id);
  }
}
