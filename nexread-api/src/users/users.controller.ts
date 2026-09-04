import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
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
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import {
  PaginatedUsersResponseDto,
  UserResponseDto,
} from './dto/user-response.dto';
import { UsersService } from './users.service';

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
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Search and paginate users (admin only)' })
  @ApiOkResponse({
    description: 'Users returned without password fields',
    type: PaginatedUsersResponseDto,
  })
  findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id (admin only)' })
  @ApiOkResponse({
    description: 'User returned without the password field',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'User id is not an integer',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User was not found',
    type: ErrorResponseDto,
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/role')
  @ApiOperation({ summary: 'Change a user role (admin only)' })
  @ApiOkResponse({
    description: 'User role updated successfully',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'User id or role validation failed',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User was not found',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The operation would demote the acting or last administrator',
    type: ErrorResponseDto,
  })
  updateRole(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ) {
    return this.usersService.updateRole(
      request.user.userId,
      id,
      updateUserRoleDto.role,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a user (admin only)' })
  @ApiNoContentResponse({ description: 'User soft-deleted successfully' })
  @ApiBadRequestResponse({
    description: 'User id is not an integer',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User was not found',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The operation would delete the acting or last administrator',
    type: ErrorResponseDto,
  })
  remove(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usersService.adminRemove(request.user.userId, id);
  }
}
