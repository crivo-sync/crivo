import { Patient } from '@prisma/client';

export type CreatePatientData = {
  tenantId: string;
  name: string;
  cpf?: string;
  phone: string;
  email?: string;
};

export type UpdatePatientData = {
  phone?: string;
  email?: string;
};

export const PATIENT_REPOSITORY = 'PatientRepository';

export type PatientRepository = {
  findMany(tenantId: string): Promise<Patient[]>;
};
