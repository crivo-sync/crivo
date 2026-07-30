import { Injectable } from '@nestjs/common';
import { Tenant } from '@prisma/client';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import {
  TenantRepository,
  UpdateTenantData,
} from '../../domain/repository/tenant.repository';

@Injectable()
export class PrismaTenantRepository implements TenantRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({ where: { id } });
  }

  findBySubdomain(subdomain: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({ where: { subdomain } });
  }

  update(id: string, data: UpdateTenantData): Promise<Tenant> {
    return this.prisma.tenant.update({ where: { id }, data });
  }
}
