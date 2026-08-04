import { Module } from '@nestjs/common';

import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { TenantController } from './infrastructure/http/tenant.controller';
import { PrismaTenantRepository } from './infrastructure/prisma/prisma-tenant.repository';
import { TENANT_REPOSITORY } from './domain/repository/tenant.repository';
import { GetTenantUseCase } from './application/use-cases/get-tenant.use-case';
import { UpdateTenantUseCase } from './application/use-cases/update-tenant.use-case';
import { GetTenantBrandingUseCase } from './application/use-cases/get-tenant-branding.use-case';
import { UpdateTenantLogoUseCase } from './application/use-cases/update-tenant-logo.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [TenantController],
  providers: [
    {
      provide: TENANT_REPOSITORY,
      useClass: PrismaTenantRepository,
    },
    GetTenantUseCase,
    UpdateTenantUseCase,
    GetTenantBrandingUseCase,
    UpdateTenantLogoUseCase,
  ],
  exports: [TENANT_REPOSITORY],
})
export class TenantsModule {}
