import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  USER_MANAGEMENT_REPOSITORY,
  type UserManagementRepository,
} from '../../domain/repository/user.repository';

export type UpdateMeInput = {
  userId: string;
  tenantId: string;
  name?: string;
};

@Injectable()
export class UpdateMeUseCase {
  constructor(
    @Inject(USER_MANAGEMENT_REPOSITORY)
    private readonly userRepository: UserManagementRepository,
  ) {}

  async execute({ userId, tenantId, ...changes }: UpdateMeInput) {
    const user = await this.userRepository.findByIdAndTenant(userId, tenantId);

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return this.userRepository.update(userId, changes);
  }
}
