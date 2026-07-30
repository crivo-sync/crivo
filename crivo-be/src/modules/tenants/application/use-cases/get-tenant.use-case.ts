import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  TENANT_REPOSITORY,
  type TenantRepository,
} from '../../domain/repository/tenant.repository';

@Injectable()
export class GetTenantUseCase {
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepository,
  ) {}

  async execute(tenantId: string) {
    const tenant = await this.tenantRepository.findById(tenantId);

    if (!tenant) {
      throw new NotFoundException('Tenant not found.');
    }

    return tenant;
  }
}
