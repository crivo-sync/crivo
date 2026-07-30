import { Inject, Injectable } from '@nestjs/common';

import {
  PATIENT_REPOSITORY,
  type PatientRepository,
} from '../../domain/repository/patient.repository';

export type GetPatientsInput = {
  tenantId: string;
  search?: string;
  page: number;
  perPage: number;
};

@Injectable()
export class GetPatientsUseCase {
  constructor(
    @Inject(PATIENT_REPOSITORY)
    private readonly patientRepository: PatientRepository,
  ) {}

  execute(input: GetPatientsInput) {
    return this.patientRepository.findMany(input);
  }
}
