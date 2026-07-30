import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  PATIENT_REPOSITORY,
  type PatientRepository,
} from '../../domain/repository/patient.repository';

@Injectable()
export class GetPatientByIdUseCase {
  constructor(
    @Inject(PATIENT_REPOSITORY)
    private readonly patientRepository: PatientRepository,
  ) {}

  async execute(id: string, tenantId: string) {
    // Filtrar por tenantId aqui é o que impede uma clínica de ler
    // o paciente de outra apenas adivinhando o UUID.
    const patient = await this.patientRepository.findByIdAndTenant(
      id,
      tenantId,
    );

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    return patient;
  }
}
