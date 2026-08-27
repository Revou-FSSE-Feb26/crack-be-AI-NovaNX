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
import { AuthorsService } from './authors.service';
import { AuthorResponseDto } from './dto/author-response.dto';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';

@ApiTags('Authors')
@Controller('authors')
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an author (admin only)' })
  @ApiCreatedResponse({
    description: 'Author created successfully',
    type: AuthorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Request body validation failed',
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
    description: 'Author id or name already exists',
    type: ErrorResponseDto,
  })
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  create(@Body() createAuthorDto: CreateAuthorDto) {
    return this.authorsService.create(createAuthorDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all authors' })
  @ApiOkResponse({
    description: 'Authors returned successfully',
    type: [AuthorResponseDto],
  })
  findAll() {
    return this.authorsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an author by id' })
  @ApiOkResponse({
    description: 'Author returned successfully',
    type: AuthorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Author was not found',
    type: ErrorResponseDto,
  })
  findOne(@Param('id') id: string) {
    return this.authorsService.findOne(id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an author (admin only)' })
  @ApiOkResponse({
    description: 'Author updated successfully',
    type: AuthorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Request body validation failed',
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
    description: 'Author was not found',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Author name already exists',
    type: ErrorResponseDto,
  })
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAuthorDto: UpdateAuthorDto) {
    return this.authorsService.update(id, updateAuthorDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an author (admin only)' })
  @ApiOkResponse({
    description: 'Deleted author',
    type: AuthorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Author is still referenced by one or more books',
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
    description: 'Author was not found',
    type: ErrorResponseDto,
  })
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authorsService.remove(id);
  }
}
