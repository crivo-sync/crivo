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
import {
  countProfessionalsOccupyingSeat,
  resolveTrialProfessionalLimit,
} from '../professional-limit';

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
   * Só profissional **ativo** ocupa vaga. Removido (soft delete) e
   * desativado não contam: os dois liberam vaga de verdade, senão a clínica
   * ficaria travada num limite que já não reflete quem de fato atende. É o
   * que faz a tela de "escolha quem fica" (`ResolveOverLimitUseCase`)
   * funcionar — desativar o excedente precisa liberar a vaga na hora.
   *
   * **Bloqueia sempre no teto — sem exceção para "cobra o adicional em vez
   * de recusar".**
   *
   * ⚠️ Isso já foi diferente, e foi um bug real: uma versão anterior (17/08)
   * deixava passar quando o plano tinha `stripeExtraProfessionalPriceId`
   * configurado, contando com `SyncExtraProfessionalsUseCase` para cobrar a
   * diferença depois. O efeito prático: **nenhum plano com adicional
   * vendável tinha teto de verdade** — a clínica cadastrava profissionais
   * sem limite algum, e só descobria a cobrança na fatura seguinte. Achado
   * com uma clínica real que foi de 2 para 3 profissionais no plano
   * Essencial (limite 2) sem nenhum aviso ou bloqueio.
   *
   * `maxProfessionals` do plano é o teto duro. Para crescer além dele, o
   * caminho é assinar um plano maior — não pagar avulso no mesmo plano.
   * `pricePerExtraProfessionalInCents` e `stripeExtraProfessionalPriceId`
   * continuam existindo no `Plan` e no site (mostram "depois R$ X/mês
   * cada"), mas hoje não são cobrados automaticamente por ninguém — ficam
   * como base pronta para se decidir, no futuro, um fluxo explícito de
   * "comprar profissional extra" com confirmação da clínica antes de
   * qualquer cobrança, não um bypass silencioso do limite.
   *
   * **Trial (sem `planId`) tem teto próprio**, o do maior plano ativo
   * (`resolveTrialProfessionalLimit`), não "ilimitado" — ver o porquê lá.
   */
  private async assertWithinPlanLimit(tenantId: string): Promise<void> {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { plan: { select: { maxProfessionals: true, name: true } } },
    });

    const limite = tenant.plan
      ? tenant.plan.maxProfessionals
      : await resolveTrialProfessionalLimit(this.prisma);

    if (limite === null) return;

    const activeCount = await countProfessionalsOccupyingSeat(
      this.prisma,
      tenantId,
    );

    if (activeCount >= limite) {
      throw new ForbiddenException(
        tenant.plan
          ? `O plano ${tenant.plan.name} permite até ${limite} profissional(is). Faça upgrade em Configurações → Assinatura para adicionar mais.`
          : `O teste grátis permite até ${limite} profissional(is) — o mesmo do nosso maior plano. Assine um plano em Configurações → Assinatura para continuar.`,
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
