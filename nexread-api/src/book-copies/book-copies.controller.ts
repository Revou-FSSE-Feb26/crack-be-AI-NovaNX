import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
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
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { LoanResponseDto } from '../loans/dto/loan-response.dto';
import { BookCopiesService } from './book-copies.service';
import {
  BookCopyAuditLogResponseDto,
  BookCopyResponseDto,
  PaginatedBookCopiesResponseDto,
} from './dto/book-copy-response.dto';
import { CreateBookCopyDto } from './dto/create-book-copy.dto';
import { QueryBookCopiesDto } from './dto/query-book-copies.dto';
import { UpdateBookCopyStatusDto } from './dto/update-book-copy-status.dto';

@ApiTags('Book Copies')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: ErrorResponseDto })
@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('book-copies')
export class BookCopiesController {
  constructor(private readonly bookCopiesService: BookCopiesService) {}

  @Post()
  @ApiOperation({ summary: 'Register a physical book copy (admin only)' })
  @ApiCreatedResponse({ type: BookCopyResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(@Body() data: CreateBookCopyDto) {
    return this.bookCopiesService.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'List and search physical copies (admin only)' })
  @ApiOkResponse({ type: PaginatedBookCopiesResponseDto })
  findAll(@Query() query: QueryBookCopiesDto) {
    return this.bookCopiesService.findAll(query);
  }

  @Get('available')
  @ApiOperation({ summary: 'List available physical copies (admin only)' })
  @ApiOkResponse({ type: PaginatedBookCopiesResponseDto })
  findAvailable(@Query() query: QueryBookCopiesDto) {
    return this.bookCopiesService.findAvailable(query);
  }

  @Patch('barcode/:barcode/return')
  @ApiOperation({ summary: 'Return a physical copy by scanning its barcode' })
  @ApiOkResponse({ type: LoanResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  returnByBarcode(
    @Req() request: AuthenticatedRequest,
    @Param('barcode') barcode: string,
  ) {
    return this.bookCopiesService.returnByBarcode(request.user.userId, barcode);
  }

  @Get('barcode/:barcode')
  @ApiOperation({ summary: 'Look up a physical copy by scanned barcode' })
  @ApiOkResponse({ type: BookCopyResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findByBarcode(@Param('barcode') barcode: string) {
    return this.bookCopiesService.findByBarcode(barcode);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'View condition and status history for a copy' })
  @ApiOkResponse({ type: [BookCopyAuditLogResponseDto] })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findHistory(@Param('id', ParseIntPipe) id: number) {
    return this.bookCopiesService.findHistory(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one physical copy and its active loan' })
  @ApiOkResponse({ type: BookCopyResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bookCopiesService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Change copy condition or archive it (admin only)' })
  @ApiOkResponse({ type: BookCopyResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  updateStatus(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateBookCopyStatusDto,
  ) {
    return this.bookCopiesService.updateStatus(request.user.userId, id, data);
  }
}
