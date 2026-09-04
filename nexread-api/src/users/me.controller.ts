import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { MeProfileResponseDto, UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('Me')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Bearer token is missing or invalid',
  type: ErrorResponseDto,
})
@UseGuards(JwtAuthGuard)
@Controller('me')
export class MeController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get profile and loan statistics' })
  @ApiOkResponse({
    description: 'Authenticated user returned without the password field',
    type: MeProfileResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Authenticated user was not found',
    type: ErrorResponseDto,
  })
  findMe(@Req() request: AuthenticatedRequest) {
    return this.usersService.findMe(request.user.userId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update the authenticated user profile' })
  @ApiOkResponse({
    description: 'Authenticated user profile updated successfully',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Request body validation failed',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Authenticated user was not found',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Email is already registered',
    type: ErrorResponseDto,
  })
  updateMe(
    @Req() request: AuthenticatedRequest,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(request.user.userId, updateUserDto);
  }

  @Patch('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Change the authenticated user password' })
  @ApiNoContentResponse({
    description: 'Password changed and refresh token revoked successfully',
  })
  @ApiBadRequestResponse({
    description: 'Request body validation failed',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Bearer token or current password is invalid',
    type: ErrorResponseDto,
  })
  changePassword(
    @Req() request: AuthenticatedRequest,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(
      request.user.userId,
      changePasswordDto,
    );
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete the authenticated user account' })
  @ApiNoContentResponse({
    description: 'User account soft-deleted successfully',
  })
  @ApiConflictResponse({
    description: 'Administrators cannot delete their own account',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Authenticated user was not found',
    type: ErrorResponseDto,
  })
  removeMe(@Req() request: AuthenticatedRequest) {
    return this.usersService.remove(request.user.userId);
  }
}
