import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import {
  countProfessionalsOccupyingSeat,
  resolveTrialProfessionalLimit,
} from '../professional-limit';

export type OverLimitStatus = {
  /** `true` quando há mais profissional ativo do que o plano comporta. */
  overLimit: boolean;
  activeCount: number;
  /** Teto do plano assinado (ou do trial). `null` = sem limite. */
  maxProfessionals: number | null;
  /** Quantos precisam ser desativados para voltar ao teto. */
  excess: number;
  planName: string | null;
};

/**
 * A clínica está com mais profissional ativo do que o plano permite?
 *
 * Esse estado **existe de propósito** e não é erro de ninguém: o trial tem
 * teto maior que o dos planos de baixo, então quem testou com a equipe
 * inteira e assinou o Solo cai aqui na hora. Antes, nada no backend
 * enxergava essa situação — o limite só era checado no cadastro, então quem
 * já estava acima dele seguia operando sem que o sistema soubesse, e a
 * cobrança do plano não batia com a equipe que de fato usava o produto.
 *
 * Só reporta. Quem resolve é a clínica, em `ResolveOverLimitUseCase` —
 * desativar profissional é decisão dela, não do sistema.
 */
@Injectable()
export class GetOverLimitStatusUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(tenantId: string): Promise<OverLimitStatus> {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { plan: { select: { maxProfessionals: true, name: true } } },
    });

    const activeCount = await countProfessionalsOccupyingSeat(
      this.prisma,
      tenantId,
    );

    const maxProfessionals = tenant.plan
      ? tenant.plan.maxProfessionals
      : await resolveTrialProfessionalLimit(this.prisma);

    if (maxProfessionals === null) {
      return {
        overLimit: false,
        activeCount,
        maxProfessionals: null,
        excess: 0,
        planName: tenant.plan?.name ?? null,
      };
    }

    const excess = Math.max(0, activeCount - maxProfessionals);

    return {
      overLimit: excess > 0,
      activeCount,
      maxProfessionals,
      excess,
      planName: tenant.plan?.name ?? null,
    };
  }
}
