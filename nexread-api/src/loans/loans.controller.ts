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
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { CreateLoanDto } from './dto/create-loan.dto';
import { AdminCreateLoanDto, AdminUpdateLoanDto } from './dto/admin-loan.dto';
import { CheckoutCartDto } from './dto/checkout-cart.dto';
import {
  LoanResponseDto,
  PaginatedAdminLoansResponseDto,
  PaginatedLoansResponseDto,
} from './dto/loan-response.dto';
import { QueryLoansDto } from './dto/query-loans.dto';
import { LoansService } from './loans.service';

@ApiTags('Loans')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Bearer token is missing or invalid',
  type: ErrorResponseDto,
})
@UseGuards(JwtAuthGuard)
@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post()
  @ApiOperation({ summary: 'Borrow an available book' })
  @ApiCreatedResponse({ type: LoanResponseDto })
  @ApiBadRequestResponse({
    description: 'Request body validation failed',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Book was not found',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Book is unavailable or due date is invalid',
    type: ErrorResponseDto,
  })
  borrow(
    @Req() request: AuthenticatedRequest,
    @Body() createLoanDto: CreateLoanDto,
  ) {
    return this.loansService.borrow(request.user.userId, createLoanDto);
  }

  @Get()
  @ApiOperation({ summary: 'Filter and paginate authenticated user loans' })
  @ApiOkResponse({ type: PaginatedLoansResponseDto })
  findMine(
    @Req() request: AuthenticatedRequest,
    @Query() query: QueryLoansDto,
  ) {
    return this.loansService.findMine(request.user.userId, query);
  }

  @Post('from-cart')
  @ApiOperation({ summary: 'Atomically borrow every available cart book' })
  @ApiCreatedResponse({ type: [LoanResponseDto] })
  @ApiBadRequestResponse({
    description: 'Cart is empty or duration is invalid',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'One or more cart books cannot be borrowed',
    type: ErrorResponseDto,
  })
  checkoutCart(
    @Req() request: AuthenticatedRequest,
    @Body() data: CheckoutCartDto,
  ) {
    return this.loansService.checkoutCart(request.user.userId, data);
  }

  @Patch(':id/return')
  @ApiOperation({ summary: 'Return a loan as its borrower or an admin' })
  @ApiOkResponse({ type: LoanResponseDto })
  @ApiNotFoundResponse({
    description: 'Loan was not found',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Loan belongs to another user',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Loan has already been returned',
    type: ErrorResponseDto,
  })
  returnLoan(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.loansService.returnLoan(
      request.user.userId,
      request.user.role,
      id,
    );
  }
}

@ApiTags('Admin')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/loans')
export class AdminLoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post()
  @ApiOperation({ summary: 'Create a loan for a user (admin only)' })
  @ApiCreatedResponse({ type: LoanResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(@Body() data: AdminCreateLoanDto) {
    return this.loansService.adminBorrow(data);
  }

  @Get()
  @ApiOperation({ summary: 'Search, filter, and paginate all loans' })
  @ApiOkResponse({ type: PaginatedAdminLoansResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Bearer token is missing or invalid',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Authenticated user is not an admin',
    type: ErrorResponseDto,
  })
  findAll(@Query() query: QueryLoansDto) {
    return this.loansService.findAll(query);
  }

  @Get('overdue')
  @ApiOperation({ summary: 'List overdue active loans (admin only)' })
  @ApiOkResponse({ type: PaginatedAdminLoansResponseDto })
  findOverdue(@Query() query: QueryLoansDto) {
    return this.loansService.findOverdue(query);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Change a loan due date or return it' })
  @ApiOkResponse({ type: LoanResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: AdminUpdateLoanDto,
  ) {
    return this.loansService.adminUpdate(id, data);
  }
}
