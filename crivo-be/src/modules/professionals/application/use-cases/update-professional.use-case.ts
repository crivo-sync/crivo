import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  PROFESSIONAL_REPOSITORY,
  type ProfessionalRepository,
} from '../../domain/repository/professional.repository';

export type UpdateProfessionalInput = {
  id: string;
  tenantId: string;
  name?: string;
  specialty?: string;
  councilCode?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
};

@Injectable()
export class UpdateProfessionalUseCase {
  constructor(
    @Inject(PROFESSIONAL_REPOSITORY)
    private readonly professionalRepository: ProfessionalRepository,
  ) {}

  async execute({ id, tenantId, ...changes }: UpdateProfessionalInput) {
    const professional = await this.professionalRepository.findByIdAndTenant(
      id,
      tenantId,
    );

    if (!professional) {
      throw new NotFoundException('Profissional não encontrado.');
    }

    return this.professionalRepository.update(id, changes);
  }
}
