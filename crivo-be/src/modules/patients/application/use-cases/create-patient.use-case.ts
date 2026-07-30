import { ConflictException, Inject, Injectable } from '@nestjs/common';

import {
  PATIENT_REPOSITORY,
  type PatientRepository,
} from '../../domain/repository/patient.repository';

export type CreatePatientInput = {
  tenantId: string;
  name: string;
  phone: string;
  cpf?: string;
  email?: string;
};

@Injectable()
export class CreatePatientUseCase {
  constructor(
    @Inject(PATIENT_REPOSITORY)
    private readonly patientRepository: PatientRepository,
  ) {}

  async execute(input: CreatePatientInput) {
    // CPF é opcional, mas quando informado precisa ser único dentro do tenant.
    if (input.cpf) {
      const existing = await this.patientRepository.findByCpfAndTenant(
        input.cpf,
        input.tenantId,
      );

      if (existing) {
        throw new ConflictException(
          'Já existe um paciente com este CPF nesta clínica.',
        );
      }
    }

    return this.patientRepository.create({
      tenantId: input.tenantId,
      name: input.name,
      phone: input.phone,
      cpf: input.cpf ?? null,
      email: input.email ?? null,
    });
  }
}
