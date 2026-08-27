import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
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
import { AdminService } from './admin.service';
import {
  AuthorStatisticResponseDto,
  CategoryStatisticResponseDto,
  DashboardResponseDto,
} from './dto/admin-response.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Bearer token is missing or invalid',
  type: ErrorResponseDto,
})
@ApiForbiddenResponse({
  description: 'Authenticated user is not an admin',
  type: ErrorResponseDto,
})
@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard metrics (admin only)' })
  @ApiOkResponse({ type: DashboardResponseDto })
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('authors/statistics')
  @ApiOperation({ summary: 'Get author book statistics (admin only)' })
  @ApiOkResponse({ type: [AuthorStatisticResponseDto] })
  getAuthorStatistics() {
    return this.adminService.getAuthorStatistics();
  }

  @Get('categories/statistics')
  @ApiOperation({
    summary:
      'Get category book counts, including empty categories (admin only)',
  })
  @ApiOkResponse({ type: [CategoryStatisticResponseDto] })
  getCategoryStatistics() {
    return this.adminService.getCategoryStatistics();
  }
}
