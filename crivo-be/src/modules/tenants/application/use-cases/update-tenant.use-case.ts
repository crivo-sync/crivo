import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  TENANT_REPOSITORY,
  type TenantRepository,
  type UpdateTenantData,
} from '../../domain/repository/tenant.repository';

@Injectable()
export class UpdateTenantUseCase {
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepository,
  ) {}

  async execute(tenantId: string, data: UpdateTenantData) {
    const tenant = await this.tenantRepository.findById(tenantId);

    if (!tenant) {
      throw new NotFoundException('Tenant not found.');
    }

    return this.tenantRepository.update(tenantId, data);
  }
}
