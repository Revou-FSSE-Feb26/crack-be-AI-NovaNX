import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminRepository } from './repositories/admin.repository';
import { PrismaAdminRepository } from './repositories/prisma-admin.repository';

@Module({
  controllers: [AdminController],
  providers: [
    AdminService,
    { provide: AdminRepository, useClass: PrismaAdminRepository },
  ],
})
export class AdminModule {}
