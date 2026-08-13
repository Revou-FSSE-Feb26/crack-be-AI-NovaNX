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
import { CategoriesService } from './categories.service';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a category (admin only)' })
  @ApiCreatedResponse({
    description: 'Category created successfully',
    type: CategoryResponseDto,
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
    description: 'Category id, name, or slug already exists',
    type: ErrorResponseDto,
  })
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all categories' })
  @ApiOkResponse({
    description: 'Categories returned successfully',
    type: [CategoryResponseDto],
  })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a category by id' })
  @ApiOkResponse({
    description: 'Category returned successfully',
    type: CategoryResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Category was not found',
    type: ErrorResponseDto,
  })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a category (admin only)' })
  @ApiOkResponse({
    description: 'Category updated successfully',
    type: CategoryResponseDto,
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
    description: 'Category was not found',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Category name or slug already exists',
    type: ErrorResponseDto,
  })
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a category (admin only)' })
  @ApiOkResponse({
    description: 'Deleted category',
    type: CategoryResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Category is still referenced by one or more books',
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
    description: 'Category was not found',
    type: ErrorResponseDto,
  })
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
