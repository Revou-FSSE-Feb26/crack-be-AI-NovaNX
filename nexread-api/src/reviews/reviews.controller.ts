import {
  Body,
  Controller,
  Delete,
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import {
  PaginatedMyReviewsResponseDto,
  ReviewResponseDto,
} from './dto/review-response.dto';
import { QueryReviewsDto } from './dto/query-reviews.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews')
@Controller('books/:bookId/reviews')
export class BookReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'List reviews for a book' })
  @ApiOkResponse({ type: [ReviewResponseDto] })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findByBook(@Param('bookId') bookId: string) {
    return this.reviewsService.findByBook(bookId);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Review a book once as the authenticated user' })
  @ApiCreatedResponse({ type: ReviewResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(
    @Req() request: AuthenticatedRequest,
    @Param('bookId') bookId: string,
    @Body() data: CreateReviewDto,
  ) {
    return this.reviewsService.create(request.user.userId, bookId, data);
  }
}

@ApiTags('Reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Patch(':id')
  @ApiOperation({
    summary: 'Update own review (admins may moderate any review)',
  })
  @ApiOkResponse({ type: ReviewResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateReviewDto,
  ) {
    return this.reviewsService.update(
      request.user.userId,
      request.user.role,
      id,
      data,
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete own review (admins may moderate any review)',
  })
  @ApiOkResponse({ type: ReviewResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  remove(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.reviewsService.remove(
      request.user.userId,
      request.user.role,
      id,
    );
  }
}

@ApiTags('Me')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me/reviews')
export class MeReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({
    summary: 'List authenticated user reviews with book details',
  })
  @ApiOkResponse({ type: PaginatedMyReviewsResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  findMine(
    @Req() request: AuthenticatedRequest,
    @Query() query: QueryReviewsDto,
  ) {
    return this.reviewsService.findMine(request.user.userId, query);
  }
}
