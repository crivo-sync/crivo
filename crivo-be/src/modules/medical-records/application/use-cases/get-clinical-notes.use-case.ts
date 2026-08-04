import { Inject, Injectable } from '@nestjs/common';

import {
  MEDICAL_RECORD_REPOSITORY,
  type MedicalRecordRepository,
  type PaginatedClinicalNotes,
} from '../../domain/repository/medical-record.repository';
import { PatientGuardService } from '../services/patient-guard.service';

export type GetClinicalNotesInput = {
  patientId: string;
  tenantId: string;
  page: number;
  perPage: number;
};

@Injectable()
export class GetClinicalNotesUseCase {
  constructor(
    @Inject(MEDICAL_RECORD_REPOSITORY)
    private readonly repository: MedicalRecordRepository,
    private readonly patientGuard: PatientGuardService,
  ) {}

  async execute(input: GetClinicalNotesInput): Promise<PaginatedClinicalNotes> {
    await this.patientGuard.assertBelongsToTenant(
      input.patientId,
      input.tenantId,
    );

    return this.repository.findClinicalNotes(input);
  }
}
