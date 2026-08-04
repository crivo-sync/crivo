import { Tenant } from '@prisma/client';

export type UpdateTenantData = {
  name?: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  aiMessagesEnabled?: boolean;
  businessHoursStart?: number;
  businessHoursEnd?: number;
  businessDays?: number[];
};

export const TENANT_REPOSITORY = 'TenantRepository';

export type TenantRepository = {
  findById(id: string): Promise<Tenant | null>;
  findBySubdomain(subdomain: string): Promise<Tenant | null>;
  update(id: string, data: UpdateTenantData): Promise<Tenant>;
};
