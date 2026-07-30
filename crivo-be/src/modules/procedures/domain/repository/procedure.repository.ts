import { Procedure } from '@prisma/client';

export type CreateProcedureData = {
  tenantId: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  priceInCents: number;
};

export type UpdateProcedureData = {
  name?: string;
  description?: string | null;
  durationMinutes?: number;
  priceInCents?: number;
  isActive?: boolean;
};

export type FindManyProceduresParams = {
  tenantId: string;
  search?: string;
  page: number;
  perPage: number;
};

export type PaginatedProcedures = {
  data: Procedure[];
  total: number;
};

export const PROCEDURE_REPOSITORY = 'ProcedureRepository';

export type ProcedureRepository = {
  findMany(params: FindManyProceduresParams): Promise<PaginatedProcedures>;
  findByIdAndTenant(id: string, tenantId: string): Promise<Procedure | null>;
  create(data: CreateProcedureData): Promise<Procedure>;
  update(id: string, data: UpdateProcedureData): Promise<Procedure>;
  softDelete(id: string): Promise<void>;
};
