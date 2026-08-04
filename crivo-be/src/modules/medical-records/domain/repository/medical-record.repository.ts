import { Anamnesis, ClinicalNote } from '@prisma/client';

export type AnamnesisWithAuthor = Anamnesis & {
  updatedByUser: { id: string; name: string } | null;
};

export type ClinicalNoteWithAuthor = ClinicalNote & {
  author: { id: string; name: string };
};

export type UpsertAnamnesisData = {
  tenantId: string;
  patientId: string;
  allergies?: string | null;
  medications?: string | null;
  conditions?: string | null;
  observations?: string | null;
  updatedByUserId: string;
};

export type CreateClinicalNoteData = {
  tenantId: string;
  patientId: string;
  appointmentId?: string | null;
  authorUserId: string;
  content: string;
};

export type FindClinicalNotesParams = {
  tenantId: string;
  patientId: string;
  page: number;
  perPage: number;
};

export type PaginatedClinicalNotes = {
  data: ClinicalNoteWithAuthor[];
  total: number;
};

export const MEDICAL_RECORD_REPOSITORY = 'MedicalRecordRepository';

/**
 * Note que **não existe** `updateClinicalNote` nem `deleteClinicalNote`: a
 * evolução é append-only. Corrigir um registro clínico é adicionar uma nota
 * nova, nunca reescrever a anterior.
 */
export type MedicalRecordRepository = {
  findAnamnesisByPatient(
    patientId: string,
    tenantId: string,
  ): Promise<AnamnesisWithAuthor | null>;
  upsertAnamnesis(data: UpsertAnamnesisData): Promise<AnamnesisWithAuthor>;
  findClinicalNotes(
    params: FindClinicalNotesParams,
  ): Promise<PaginatedClinicalNotes>;
  createClinicalNote(
    data: CreateClinicalNoteData,
  ): Promise<ClinicalNoteWithAuthor>;
};
