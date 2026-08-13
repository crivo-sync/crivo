import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
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
    private readonly prisma: PrismaService,
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

    // Ligar a IA é feature de plano, não preferência livre. Sem esta checagem
    // o toggle ficava ligado no Solo/Básico e a clínica achava que tinha o
    // recurso — o envio até respeita o plano, mas a tela mentia.
    //
    // Trial (`planId: null`) pode ligar: é assim que experimenta o recurso.
    if (data.aiMessagesEnabled === true) {
      const withPlan = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { plan: { select: { hasAiMessages: true, name: true } } },
      });

      if (withPlan?.plan && !withPlan.plan.hasAiMessages) {
        throw new BadRequestException(
          `As mensagens com IA não estão incluídas no plano ${withPlan.plan.name}. ` +
            'Faça upgrade em Configurações → Assinatura para ativar.',
        );
      }
    }

    return this.tenantRepository.update(tenantId, data);
  }
}
