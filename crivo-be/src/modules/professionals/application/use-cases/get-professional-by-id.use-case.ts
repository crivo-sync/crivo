import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  PROFESSIONAL_REPOSITORY,
  type ProfessionalRepository,
} from '../../domain/repository/professional.repository';

@Injectable()
export class GetProfessionalByIdUseCase {
  constructor(
    @Inject(PROFESSIONAL_REPOSITORY)
    private readonly professionalRepository: ProfessionalRepository,
  ) {}

  async execute(id: string, tenantId: string) {
    const professional = await this.professionalRepository.findByIdAndTenant(
      id,
      tenantId,
    );

    if (!professional) {
      throw new NotFoundException('Profissional não encontrado.');
    }

    return professional;
  }
}
