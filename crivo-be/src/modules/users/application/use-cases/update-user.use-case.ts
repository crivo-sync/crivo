import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';

import {
  USER_MANAGEMENT_REPOSITORY,
  type UserManagementRepository,
} from '../../domain/repository/user.repository';

export type UpdateUserInput = {
  targetUserId: string;
  tenantId: string;
  requesterId: string;
  name?: string;
  role?: Role;
  isActive?: boolean;
};

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_MANAGEMENT_REPOSITORY)
    private readonly userRepository: UserManagementRepository,
  ) {}

  async execute(input: UpdateUserInput) {
    const { targetUserId, tenantId, requesterId, ...changes } = input;

    const target = await this.userRepository.findByIdAndTenant(
      targetUserId,
      tenantId,
    );

    if (!target) {
      throw new NotFoundException('User not found.');
    }

    // Evita o admin se trancar para fora / deixar o tenant sem administrador.
    const isSelf = targetUserId === requesterId;
    const isDemotingSelf =
      changes.role !== undefined && changes.role !== Role.ADMIN;
    const isDeactivatingSelf = changes.isActive === false;

    if (isSelf && (isDemotingSelf || isDeactivatingSelf)) {
      throw new BadRequestException(
        'You cannot demote or deactivate your own admin account.',
      );
    }

    return this.userRepository.update(targetUserId, changes);
  }
}
