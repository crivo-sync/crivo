import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  USER_MANAGEMENT_REPOSITORY,
  type UserManagementRepository,
} from '../../domain/repository/user.repository';

@Injectable()
export class GetMeUseCase {
  constructor(
    @Inject(USER_MANAGEMENT_REPOSITORY)
    private readonly userRepository: UserManagementRepository,
  ) {}

  async execute(userId: string, tenantId: string) {
    const user = await this.userRepository.findByIdAndTenant(userId, tenantId);

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }
}
