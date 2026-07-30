import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  PATIENT_REPOSITORY,
  type PatientRepository,
} from '../../domain/repository/patient.repository';

export type UpdatePatientInput = {
  id: string;
  tenantId: string;
  name?: string;
  phone?: string;
  cpf?: string;
  email?: string;
};

@Injectable()
export class UpdatePatientUseCase {
  constructor(
    @Inject(PATIENT_REPOSITORY)
    private readonly patientRepository: PatientRepository,
  ) {}

  async execute({ id, tenantId, ...changes }: UpdatePatientInput) {
    const patient = await this.patientRepository.findByIdAndTenant(
      id,
      tenantId,
    );

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    // Só checa colisão se o CPF realmente mudou.
    if (changes.cpf && changes.cpf !== patient.cpf) {
      const existing = await this.patientRepository.findByCpfAndTenant(
        changes.cpf,
        tenantId,
      );

      if (existing) {
        throw new ConflictException(
          'Já existe um paciente com este CPF nesta clínica.',
        );
      }
    }

    return this.patientRepository.update(id, changes);
  }
}
