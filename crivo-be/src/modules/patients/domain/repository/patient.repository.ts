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

/** Só o que a importação precisa para decidir se a linha é duplicata. */
export type ExistingPatientKey = {
  cpf: string | null;
  phone: string;
};

export const PATIENT_REPOSITORY = 'PatientRepository';

export type PatientRepository = {
  findMany(params: FindManyPatientsParams): Promise<PaginatedPatients>;
  findByIdAndTenant(id: string, tenantId: string): Promise<Patient | null>;
  findByCpfAndTenant(cpf: string, tenantId: string): Promise<Patient | null>;
  /**
   * Busca em lote os pacientes que casam com algum CPF/telefone da lista.
   *
   * Considera **apenas os ativos**: o `delete` move o CPF do removido para
   * `<cpf>_del_<timestamp>` justamente para liberar o `@@unique`, então um
   * paciente excluído nem colide no índice nem deve bloquear a reimportação
   * — recadastrar quem foi excluído é o comportamento desejado.
   */
  findExistingKeys(params: {
    tenantId: string;
    cpfs: string[];
    phones: string[];
  }): Promise<ExistingPatientKey[]>;
  create(data: CreatePatientData): Promise<Patient>;
  createMany(data: CreatePatientData[]): Promise<number>;
  update(id: string, data: UpdatePatientData): Promise<Patient>;
  delete(id: string): Promise<void>;
};
