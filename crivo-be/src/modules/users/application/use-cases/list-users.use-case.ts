import { Inject, Injectable } from '@nestjs/common';

import {
  USER_MANAGEMENT_REPOSITORY,
  type UserManagementRepository,
} from '../../domain/repository/user.repository';

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(USER_MANAGEMENT_REPOSITORY)
    private readonly userRepository: UserManagementRepository,
  ) {}

  execute(tenantId: string) {
    return this.userRepository.findManyByTenant(tenantId);
  }
}
