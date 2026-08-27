import { Module } from '@nestjs/common';
import { AdminLoansController, LoansController } from './loans.controller';
import { LoansService } from './loans.service';
import { LoansRepository } from './repositories/loans.repository';
import { PrismaLoansRepository } from './repositories/prisma-loans.repository';

@Module({
  controllers: [LoansController, AdminLoansController],
  providers: [
    LoansService,
    { provide: LoansRepository, useClass: PrismaLoansRepository },
  ],
})
export class LoansModule {}
