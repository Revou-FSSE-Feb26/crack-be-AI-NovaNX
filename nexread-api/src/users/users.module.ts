import { Module } from '@nestjs/common';
import { MeController } from './me.controller';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './repositories/users.repository';
import { PrismaUsersRepository } from './repositories/prisma-users.repository';

@Module({
  controllers: [MeController, UsersController],
  providers: [
    UsersService,
    { provide: UsersRepository, useClass: PrismaUsersRepository },
  ],
  exports: [UsersService],
})
export class UsersModule {}
