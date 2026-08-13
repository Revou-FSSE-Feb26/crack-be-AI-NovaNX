import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Role } from '../../../generated/prisma/enums';
import { AuthorsController } from '../../authors/authors.controller';
import { BooksController } from '../../books/books.controller';
import { CategoriesController } from '../../categories/categories.controller';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

describe('catalog admin access', () => {
  const controllers = [
    AuthorsController,
    CategoriesController,
    BooksController,
  ];

  it.each(controllers)(
    'restricts mutation handlers on $name to authenticated admins',
    (Controller) => {
      for (const handlerName of ['create', 'update', 'remove'] as const) {
        const handler = Controller.prototype[handlerName];

        expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual([Role.ADMIN]);
        expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toEqual([
          JwtAuthGuard,
          RolesGuard,
        ]);
      }
    },
  );

  it.each(controllers)('keeps read handlers on $name public', (Controller) => {
    for (const handlerName of ['findAll', 'findOne'] as const) {
      const handler = Controller.prototype[handlerName];

      expect(Reflect.getMetadata(ROLES_KEY, handler)).toBeUndefined();
      expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toBeUndefined();
    }
  });
});
