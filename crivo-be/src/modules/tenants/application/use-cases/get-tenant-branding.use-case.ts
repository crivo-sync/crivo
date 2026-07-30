import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  TENANT_REPOSITORY,
  type TenantRepository,
} from '../../domain/repository/tenant.repository';

/**
 * Endpoint público: o front white-label precisa de logo/cores antes do login.
 * Só expõe dados de identidade visual — nada sensível.
 */
@Injectable()
export class GetTenantBrandingUseCase {
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepository,
  ) {}

  async execute(subdomain: string) {
    const tenant = await this.tenantRepository.findBySubdomain(subdomain);

    if (!tenant || !tenant.isActive) {
      throw new NotFoundException('Tenant not found.');
    }

    return {
      name: tenant.name,
      subdomain: tenant.subdomain,
      logoUrl: tenant.logoUrl,
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
    };
  }
}
