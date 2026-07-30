import { Professional } from '@prisma/client';

export type CreateProfessionalData = {
  tenantId: string;
  name: string;
  specialty?: string | null;
  councilCode?: string | null;
  phone?: string | null;
  email?: string | null;
  userId?: string | null;
};

export type UpdateProfessionalData = {
  name?: string;
  specialty?: string | null;
  councilCode?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive?: boolean;
};

export type FindManyProfessionalsParams = {
  tenantId: string;
  search?: string;
  page: number;
  perPage: number;
};

export type PaginatedProfessionals = {
  data: Professional[];
  total: number;
};

export const PROFESSIONAL_REPOSITORY = 'ProfessionalRepository';

export type ProfessionalRepository = {
  findMany(
    params: FindManyProfessionalsParams,
  ): Promise<PaginatedProfessionals>;
  findByIdAndTenant(id: string, tenantId: string): Promise<Professional | null>;
  create(data: CreateProfessionalData): Promise<Professional>;
  update(id: string, data: UpdateProfessionalData): Promise<Professional>;
  softDelete(id: string): Promise<void>;
  countActiveByTenant(tenantId: string): Promise<number>;
};
