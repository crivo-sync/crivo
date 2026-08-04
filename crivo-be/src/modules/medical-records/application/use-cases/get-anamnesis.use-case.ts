import { Inject, Injectable } from '@nestjs/common';

import {
  MEDICAL_RECORD_REPOSITORY,
  type AnamnesisWithAuthor,
  type MedicalRecordRepository,
} from '../../domain/repository/medical-record.repository';
import { PatientGuardService } from '../services/patient-guard.service';

@Injectable()
export class GetAnamnesisUseCase {
  constructor(
    @Inject(MEDICAL_RECORD_REPOSITORY)
    private readonly repository: MedicalRecordRepository,
    private readonly patientGuard: PatientGuardService,
  ) {}

  /**
   * Devolve `null` quando a ficha nunca foi preenchida — não é erro. A tela
   * abre o formulário vazio, e um 404 aqui obrigaria o front a tratar
   * "ainda não preenchida" como falha.
   */
  async execute(
    patientId: string,
    tenantId: string,
  ): Promise<AnamnesisWithAuthor | null> {
    await this.patientGuard.assertBelongsToTenant(patientId, tenantId);

    return this.repository.findAnamnesisByPatient(patientId, tenantId);
  }
}
