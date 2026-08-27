import { Injectable } from '@nestjs/common';
import { AdminRepository } from './repositories/admin.repository';

@Injectable()
export class AdminService {
  constructor(private readonly adminRepository: AdminRepository) {}

  getDashboard() {
    return this.adminRepository.getDashboard();
  }

  getAuthorStatistics() {
    return this.adminRepository.getAuthorStatistics();
  }

  getCategoryStatistics() {
    return this.adminRepository.getCategoryStatistics();
  }
}
