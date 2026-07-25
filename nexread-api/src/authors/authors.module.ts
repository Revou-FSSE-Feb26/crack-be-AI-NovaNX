import { Module } from '@nestjs/common';
import { AuthorsService } from './authors.service';
import { AuthorsController } from './authors.controller';
import { AuthorsRepository } from './repositories/authors.repository';
import { PrismaAuthorsRepository } from './repositories/prisma-authors.repository';

@Module({
  controllers: [AuthorsController],
  providers: [
    AuthorsService,
    { provide: AuthorsRepository, useClass: PrismaAuthorsRepository },
  ],
})
export class AuthorsModule {}
