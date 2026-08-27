import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
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
import { AdminLoanResponseDto, LoanResponseDto } from './dto/loan-response.dto';
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
  @ApiOperation({ summary: 'List loans for the authenticated user' })
  @ApiOkResponse({ type: [LoanResponseDto] })
  findMine(@Req() request: AuthenticatedRequest) {
    return this.loansService.findMine(request.user.userId);
  }

  @Patch(':id/return')
  @ApiOperation({ summary: 'Return one of the authenticated user loans' })
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
  returnMine(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.loansService.returnMine(request.user.userId, id);
  }
}

@ApiTags('Admin')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/loans')
export class AdminLoansController {
  constructor(private readonly loansService: LoansService) {}

  @Get()
  @ApiOperation({ summary: 'List all loans (admin only)' })
  @ApiOkResponse({ type: [AdminLoanResponseDto] })
  @ApiUnauthorizedResponse({
    description: 'Bearer token is missing or invalid',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Authenticated user is not an admin',
    type: ErrorResponseDto,
  })
  findAll() {
    return this.loansService.findAll();
  }
}
