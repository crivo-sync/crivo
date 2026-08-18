import { Inject, Injectable } from '@nestjs/common';

import {
  PROFESSIONAL_REPOSITORY,
  type ProfessionalRepository,
} from '../../domain/repository/professional.repository';

export type GetProfessionalsInput = {
  tenantId: string;
  search?: string;
  page: number;
  perPage: number;
  /** `true` esconde os desativados — ver `FindManyProfessionalsParams`. */
  onlyActive?: boolean;
};

@Injectable()
export class GetProfessionalsUseCase {
  constructor(
    @Inject(PROFESSIONAL_REPOSITORY)
    private readonly professionalRepository: ProfessionalRepository,
  ) {}

  execute(input: GetProfessionalsInput) {
    return this.professionalRepository.findMany(input);
  }
}
