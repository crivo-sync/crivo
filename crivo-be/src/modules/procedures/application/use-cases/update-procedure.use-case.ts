import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  PROCEDURE_REPOSITORY,
  type ProcedureRepository,
} from '../../domain/repository/procedure.repository';

export type UpdateProcedureInput = {
  id: string;
  tenantId: string;
  name?: string;
  description?: string;
  durationMinutes?: number;
  priceInCents?: number;
  isActive?: boolean;
};

@Injectable()
export class UpdateProcedureUseCase {
  constructor(
    @Inject(PROCEDURE_REPOSITORY)
    private readonly procedureRepository: ProcedureRepository,
  ) {}

  async execute({ id, tenantId, ...changes }: UpdateProcedureInput) {
    const procedure = await this.procedureRepository.findByIdAndTenant(
      id,
      tenantId,
    );

    if (!procedure) {
      throw new NotFoundException('Procedimento não encontrado.');
    }

    // O preço só muda daqui pra frente: agendamentos já criados guardam o
    // priceInCents praticado no ato.
    return this.procedureRepository.update(id, changes);
  }
}
