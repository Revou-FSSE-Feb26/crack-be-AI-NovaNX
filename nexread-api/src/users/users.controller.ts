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
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SelfOrAdminGuard } from '../auth/guards/self-or-admin.guard';
import { Role } from '../../generated/prisma/enums';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Bearer token is missing or invalid',
  type: ErrorResponseDto,
})
@ApiForbiddenResponse({
  description: 'Authenticated user does not have access to this account',
  type: ErrorResponseDto,
})
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Get()
  @ApiOperation({ summary: 'List all users (admin only)' })
  @ApiOkResponse({
    description: 'Users returned without password fields',
    type: [UserResponseDto],
  })
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(SelfOrAdminGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get a user (self or admin)' })
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

  @UseGuards(SelfOrAdminGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a user profile (self or admin)' })
  @ApiOkResponse({
    description: 'User updated successfully without the password field',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'User id or request body validation failed',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User was not found',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Email is already registered',
    type: ErrorResponseDto,
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
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
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ) {
    return this.usersService.updateRole(id, updateUserRoleDto.role);
  }

  @UseGuards(SelfOrAdminGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user (self or admin)' })
  @ApiNoContentResponse({ description: 'User deleted successfully' })
  @ApiBadRequestResponse({
    description: 'User id is not an integer',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User was not found',
    type: ErrorResponseDto,
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
