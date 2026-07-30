import { Inject, Injectable } from '@nestjs/common';

import {
  PROCEDURE_REPOSITORY,
  type ProcedureRepository,
} from '../../domain/repository/procedure.repository';

export type CreateProcedureInput = {
  tenantId: string;
  name: string;
  description?: string;
  durationMinutes: number;
  priceInCents: number;
};

@Injectable()
export class CreateProcedureUseCase {
  constructor(
    @Inject(PROCEDURE_REPOSITORY)
    private readonly procedureRepository: ProcedureRepository,
  ) {}

  execute(input: CreateProcedureInput) {
    return this.procedureRepository.create({
      tenantId: input.tenantId,
      name: input.name,
      description: input.description ?? null,
      durationMinutes: input.durationMinutes,
      priceInCents: input.priceInCents,
    });
  }
}
