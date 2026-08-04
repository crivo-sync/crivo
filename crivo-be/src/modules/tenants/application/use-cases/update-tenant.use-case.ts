import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  TENANT_REPOSITORY,
  type TenantRepository,
  type UpdateTenantData,
} from '../../domain/repository/tenant.repository';

@Injectable()
export class UpdateTenantUseCase {
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepository,
  ) {}

  async execute(tenantId: string, data: UpdateTenantData) {
    const tenant = await this.tenantRepository.findById(tenantId);

    if (!tenant) {
      throw new NotFoundException('Tenant not found.');
    }

    // O DTO valida cada campo isolado; a relação entre eles só dá pra checar
    // aqui, e contra o valor já salvo — a recepção pode mandar só um dos dois.
    const start = data.businessHoursStart ?? tenant.businessHoursStart;
    const end = data.businessHoursEnd ?? tenant.businessHoursEnd;

    if (start >= end) {
      throw new BadRequestException(
        'O horário de abertura precisa ser anterior ao de fechamento.',
      );
    }

    return this.tenantRepository.update(tenantId, data);
  }
}
