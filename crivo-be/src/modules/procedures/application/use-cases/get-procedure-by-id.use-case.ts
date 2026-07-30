import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  PROCEDURE_REPOSITORY,
  type ProcedureRepository,
} from '../../domain/repository/procedure.repository';

@Injectable()
export class GetProcedureByIdUseCase {
  constructor(
    @Inject(PROCEDURE_REPOSITORY)
    private readonly procedureRepository: ProcedureRepository,
  ) {}

  async execute(id: string, tenantId: string) {
    const procedure = await this.procedureRepository.findByIdAndTenant(
      id,
      tenantId,
    );

    if (!procedure) {
      throw new NotFoundException('Procedimento não encontrado.');
    }

    return procedure;
  }
}
