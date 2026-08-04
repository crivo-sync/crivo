import { Inject, Injectable } from '@nestjs/common';

import {
  MEDICAL_RECORD_REPOSITORY,
  type AnamnesisWithAuthor,
  type MedicalRecordRepository,
} from '../../domain/repository/medical-record.repository';
import { PatientGuardService } from '../services/patient-guard.service';

export type UpsertAnamnesisInput = {
  patientId: string;
  tenantId: string;
  updatedByUserId: string;
  allergies?: string;
  medications?: string;
  conditions?: string;
  observations?: string;
};

@Injectable()
export class UpsertAnamnesisUseCase {
  constructor(
    @Inject(MEDICAL_RECORD_REPOSITORY)
    private readonly repository: MedicalRecordRepository,
    private readonly patientGuard: PatientGuardService,
  ) {}

  async execute({
    patientId,
    tenantId,
    updatedByUserId,
    ...fields
  }: UpsertAnamnesisInput): Promise<AnamnesisWithAuthor> {
    await this.patientGuard.assertBelongsToTenant(patientId, tenantId);

    return this.repository.upsertAnamnesis({
      tenantId,
      patientId,
      updatedByUserId,
      // Campo vazio no formulário significa "não há nada a registrar", e não
      // "não mexer" — por isso `''` vira `null` em vez de ser ignorado.
      allergies: fields.allergies || null,
      medications: fields.medications || null,
      conditions: fields.conditions || null,
      observations: fields.observations || null,
    });
  }
}
