import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import {
  PROFESSIONAL_REPOSITORY,
  type ProfessionalRepository,
} from '../../domain/repository/professional.repository';

export type CreateProfessionalInput = {
  tenantId: string;
  name: string;
  specialty?: string;
  councilCode?: string;
  phone?: string;
  email?: string;
  procedureIds?: string[];
};

@Injectable()
export class CreateProfessionalUseCase {
  constructor(
    @Inject(PROFESSIONAL_REPOSITORY)
    private readonly professionalRepository: ProfessionalRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(input: CreateProfessionalInput) {
    if (input.procedureIds?.length) {
      await this.assertProceduresBelongToTenant(
        input.tenantId,
        input.procedureIds,
      );
    }

    await this.assertWithinPlanLimit(input.tenantId);

    return this.professionalRepository.create({
      tenantId: input.tenantId,
      name: input.name,
      specialty: input.specialty ?? null,
      councilCode: input.councilCode ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      procedureIds: input.procedureIds,
    });
  }

  /**
   * Tenant em trial (sem `planId`) não tem limite — o trial libera o
   * produto inteiro. Profissional removido (soft delete) não conta: deletar
   * libera vaga de verdade, senão a clínica ficaria travada num limite que
   * já não reflete a equipe atual.
   */
  private async assertWithinPlanLimit(tenantId: string): Promise<void> {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { plan: { select: { maxProfessionals: true, name: true } } },
    });

    if (!tenant.plan || tenant.plan.maxProfessionals === null) return;

    const activeCount = await this.prisma.professional.count({
      where: { tenantId, deletedAt: null },
    });

    if (activeCount >= tenant.plan.maxProfessionals) {
      throw new ForbiddenException(
        `O plano ${tenant.plan.name} permite até ${tenant.plan.maxProfessionals} profissional(is). Faça upgrade em Configurações → Assinatura para adicionar mais.`,
      );
    }
  }

  // Sem isso, um payload malformado (ou de outro tenant) conseguiria linkar
  // um procedimento que não é dessa clínica.
  private async assertProceduresBelongToTenant(
    tenantId: string,
    procedureIds: string[],
  ) {
    const found = await this.prisma.procedure.findMany({
      where: { id: { in: procedureIds }, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (found.length !== new Set(procedureIds).size) {
      throw new BadRequestException('Um ou mais procedimentos são inválidos.');
    }
  }
}
