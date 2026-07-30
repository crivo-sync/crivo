import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  PATIENT_REPOSITORY,
  type PatientRepository,
} from '../../domain/repository/patient.repository';

@Injectable()
export class DeletePatientUseCase {
  constructor(
    @Inject(PATIENT_REPOSITORY)
    private readonly patientRepository: PatientRepository,
  ) {}

  async execute(id: string, tenantId: string) {
    const patient = await this.patientRepository.findByIdAndTenant(
      id,
      tenantId,
    );

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    await this.patientRepository.delete(id);
  }
}
