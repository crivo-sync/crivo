import { Inject, Injectable } from '@nestjs/common';

import {
  PROCEDURE_REPOSITORY,
  type ProcedureRepository,
} from '../../domain/repository/procedure.repository';

export type GetProceduresInput = {
  tenantId: string;
  search?: string;
  page: number;
  perPage: number;
};

@Injectable()
export class GetProceduresUseCase {
  constructor(
    @Inject(PROCEDURE_REPOSITORY)
    private readonly procedureRepository: ProcedureRepository,
  ) {}

  execute(input: GetProceduresInput) {
    return this.procedureRepository.findMany(input);
  }
}
