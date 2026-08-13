import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedRequest } from './interfaces/authenticated-request.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a user and issue a token pair' })
  @ApiCreatedResponse({
    description: 'User registered successfully',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Request body validation failed',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Email is already registered',
    type: ErrorResponseDto,
  })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Authenticate a user and issue a token pair' })
  @ApiOkResponse({
    description: 'Authentication succeeded',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Request body validation failed',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Email or password is invalid',
    type: ErrorResponseDto,
  })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @ApiOperation({
    summary: 'Rotate a refresh token and issue a new token pair',
  })
  @ApiOkResponse({
    description: 'Refresh token accepted and rotated',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Request body validation failed',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Refresh token is invalid, expired, revoked, or already used',
    type: ErrorResponseDto,
  })
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refresh(refreshTokenDto.refreshToken);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Revoke the current user refresh token' })
  @ApiNoContentResponse({ description: 'Refresh token revoked successfully' })
  @ApiUnauthorizedResponse({
    description: 'Bearer access token is missing or invalid',
    type: ErrorResponseDto,
  })
  logout(@Req() request: AuthenticatedRequest) {
    return this.authService.logout(request.user.userId);
  }
}
