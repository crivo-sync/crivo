import { Patient } from '@prisma/client';

export type CreatePatientData = {
  tenantId: string;
  name: string;
  phone: string;
  cpf?: string | null;
  email?: string | null;
};

export type UpdatePatientData = {
  name?: string;
  phone?: string;
  cpf?: string | null;
  email?: string | null;
};

export type FindManyPatientsParams = {
  tenantId: string;
  /** Busca por nome, CPF ou telefone. */
  search?: string;
  page: number;
  perPage: number;
};

export type PaginatedPatients = {
  data: Patient[];
  total: number;
};

export const PATIENT_REPOSITORY = 'PatientRepository';

export type PatientRepository = {
  findMany(params: FindManyPatientsParams): Promise<PaginatedPatients>;
  findByIdAndTenant(id: string, tenantId: string): Promise<Patient | null>;
  findByCpfAndTenant(cpf: string, tenantId: string): Promise<Patient | null>;
  create(data: CreatePatientData): Promise<Patient>;
  update(id: string, data: UpdatePatientData): Promise<Patient>;
  delete(id: string): Promise<void>;
};
