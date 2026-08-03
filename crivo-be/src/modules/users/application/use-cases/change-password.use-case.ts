import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import {
  USER_MANAGEMENT_REPOSITORY,
  type UserManagementRepository,
} from '../../domain/repository/user.repository';

export type ChangePasswordInput = {
  userId: string;
  tenantId: string;
  currentPassword: string;
  newPassword: string;
};

const SALT_ROUNDS = 10;

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(USER_MANAGEMENT_REPOSITORY)
    private readonly userRepository: UserManagementRepository,
  ) {}

  async execute(input: ChangePasswordInput): Promise<void> {
    const user = await this.userRepository.findByIdAndTenant(
      input.userId,
      input.tenantId,
    );

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const matches = await bcrypt.compare(input.currentPassword, user.password);
    if (!matches) {
      throw new BadRequestException('Current password is incorrect.');
    }

    await this.userRepository.update(input.userId, {
      password: await bcrypt.hash(input.newPassword, SALT_ROUNDS),
    });
  }
}
