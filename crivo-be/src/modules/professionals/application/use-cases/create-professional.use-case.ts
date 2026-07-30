import { Inject, Injectable } from '@nestjs/common';

import {
  PROFESSIONAL_REPOSITORY,
  type ProfessionalRepository,
} from '../../domain/repository/professional.repository';

export type CreateProfessionalInput = {
  tenantId: string;
  name: string;
  specialty?: string;
  councilCode?: string;
  phone?: string;
  email?: string;
};

@Injectable()
export class CreateProfessionalUseCase {
  constructor(
    @Inject(PROFESSIONAL_REPOSITORY)
    private readonly professionalRepository: ProfessionalRepository,
  ) {}

  execute(input: CreateProfessionalInput) {
    return this.professionalRepository.create({
      tenantId: input.tenantId,
      name: input.name,
      specialty: input.specialty ?? null,
      councilCode: input.councilCode ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
    });
  }
}
