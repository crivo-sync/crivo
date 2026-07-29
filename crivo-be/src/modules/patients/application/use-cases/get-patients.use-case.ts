import { Inject, Injectable } from '@nestjs/common';
import {
  PATIENT_REPOSITORY,
  type PatientRepository,
} from '../../domain/repository/patient.repository';

@Injectable()
export class GetPatientUseCase {
  constructor(
    @Inject(PATIENT_REPOSITORY)
    private readonly patientRepository: PatientRepository,
  ) {}

  async execute(tenantId) {
    return this.patientRepository.findMany(tenantId);
  }
}
