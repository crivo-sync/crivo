import { Procedure, Professional } from '@prisma/client';

export type ProfessionalWithProcedures = Professional & {
  procedures: Pick<Procedure, 'id' | 'name'>[];
};

export type CreateProfessionalData = {
  tenantId: string;
  name: string;
  specialty?: string | null;
  councilCode?: string | null;
  phone?: string | null;
  email?: string | null;
  userId?: string | null;
  /** Ids já validados (mesmo tenant, ativos) pelo use case. */
  procedureIds?: string[];
};

export type UpdateProfessionalData = {
  name?: string;
  specialty?: string | null;
  councilCode?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive?: boolean;
  /** `undefined` = não mexe na lista; array (mesmo vazio) = substitui. */
  procedureIds?: string[];
};

export type FindManyProfessionalsParams = {
  tenantId: string;
  search?: string;
  page: number;
  perPage: number;
};

export type PaginatedProfessionals = {
  data: ProfessionalWithProcedures[];
  total: number;
};

export const PROFESSIONAL_REPOSITORY = 'ProfessionalRepository';

export type ProfessionalRepository = {
  findMany(
    params: FindManyProfessionalsParams,
  ): Promise<PaginatedProfessionals>;
  findByIdAndTenant(
    id: string,
    tenantId: string,
  ): Promise<ProfessionalWithProcedures | null>;
  create(data: CreateProfessionalData): Promise<ProfessionalWithProcedures>;
  update(
    id: string,
    data: UpdateProfessionalData,
  ): Promise<ProfessionalWithProcedures>;
  softDelete(id: string): Promise<void>;
  countActiveByTenant(tenantId: string): Promise<number>;
};
