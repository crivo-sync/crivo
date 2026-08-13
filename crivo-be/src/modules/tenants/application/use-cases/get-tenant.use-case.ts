import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import {
  TENANT_REPOSITORY,
  type TenantRepository,
} from '../../domain/repository/tenant.repository';

@Injectable()
export class GetTenantUseCase {
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(tenantId: string) {
    const tenant = await this.tenantRepository.findById(tenantId);

    if (!tenant) {
      throw new NotFoundException('Tenant not found.');
    }

    /**
     * As features do plano vão junto para o painel poder **esconder** o que
     * o backend recusaria de qualquer forma.
     *
     * Sem isso o frontend só tinha `planId` e mostrava aba de Predição,
     * Lista de espera, Prontuário e gráficos para quem está no Solo/Básico —
     * a pessoa clicava e levava 403 numa tela vazia, sem entender que era
     * limite de plano e não defeito.
     *
     * **Isto é conveniência de UI, não segurança.** Quem manda é o
     * `PlanFeatureGuard` no backend; esconder no cliente só evita o beco sem
     * saída.
     */
    const plan = tenant.planId
      ? await this.prisma.plan.findUnique({
          where: { id: tenant.planId },
          select: {
            name: true,
            hasPrediction: true,
            hasWaitlist: true,
            hasDashboard: true,
            hasMedicalRecords: true,
            hasAiMessages: true,
            maxProfessionals: true,
            maxMessagesPerMonth: true,
          },
        })
      : null;

    return { ...tenant, plan };
  }
}
