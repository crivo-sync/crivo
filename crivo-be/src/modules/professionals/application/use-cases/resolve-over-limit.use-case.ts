import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { resolveTrialProfessionalLimit } from '../professional-limit';

export type ResolveOverLimitInput = {
  tenantId: string;
  /** Quem **continua ativo**. Os demais são desativados. */
  keepProfessionalIds: string[];
};

/**
 * A clínica escolhe quem continua ativo quando o plano assinado comporta
 * menos gente do que ela já tem cadastrada.
 *
 * **Recebe quem fica, não quem sai.** Parece detalhe, mas é o que impede o
 * pior erro possível aqui: uma lista de "quem sai" que chega incompleta (ou
 * defasada, se alguém cadastrou outro profissional na outra aba) deixaria a
 * clínica acima do teto achando que resolveu. Com "quem fica", o resultado é
 * sempre exato — todo mundo fora da lista é desativado, ponto.
 *
 * Desativa (`isActive: false`), **nunca remove**: o profissional continua no
 * banco com agenda, histórico e prontuário. Se a clínica subir de plano
 * depois, é só reativar em Profissionais — nada foi perdido. Remover seria
 * destruir dado de verdade para resolver um problema de cobrança.
 *
 * O sistema **não escolhe sozinho** em nenhuma hipótese. Desativar por conta
 * própria (pelos mais recentes, por exemplo) acertaria o número e erraria a
 * clínica: quem entrou por último pode ser justamente quem tem a agenda
 * cheia. Quem sabe isso é ela.
 */
@Injectable()
export class ResolveOverLimitUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    input: ResolveOverLimitInput,
  ): Promise<{ deactivated: number }> {
    const { tenantId } = input;
    const keepIds = [...new Set(input.keepProfessionalIds)];

    const limite = await this.limitFor(tenantId);

    const ativos = await this.prisma.professional.findMany({
      where: { tenantId, deletedAt: null, isActive: true },
      select: { id: true, name: true },
    });
    const ativosIds = new Set(ativos.map((professional) => professional.id));

    // Sem isso, um id de outra clínica (ou inventado) entraria na conta de
    // "quantos ficam" e a clínica sairia daqui ainda acima do teto.
    const desconhecido = keepIds.find((id) => !ativosIds.has(id));
    if (desconhecido) {
      throw new BadRequestException(
        'Um ou mais profissionais selecionados não estão ativos nesta clínica.',
      );
    }

    if (limite !== null && keepIds.length > limite) {
      throw new BadRequestException(
        `Seu plano permite até ${limite} profissional(is) ativo(s); você selecionou ${keepIds.length}.`,
      );
    }

    const paraDesativar = ativos.filter(
      (professional) => !keepIds.includes(professional.id),
    );

    if (paraDesativar.length === 0) {
      return { deactivated: 0 };
    }

    /**
     * Agenda futura trava a desativação, mesma regra da remoção
     * (`DeleteProfessionalUseCase`): desativar quem tem paciente marcado
     * deixaria consultas órfãs — o profissional some da agenda e o paciente
     * aparece na clínica no dia. A clínica cancela ou realoca primeiro, e é
     * ela quem decide para quem vai.
     */
    const comAgenda = await this.prisma.appointment.groupBy({
      by: ['professionalId'],
      where: {
        professionalId: { in: paraDesativar.map((p) => p.id) },
        startsAt: { gte: new Date() },
        status: {
          in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
        },
      },
      _count: { _all: true },
    });

    if (comAgenda.length > 0) {
      const nomes = comAgenda
        .map((grupo) => {
          const professional = paraDesativar.find(
            (p) => p.id === grupo.professionalId,
          );
          return `${professional?.name ?? grupo.professionalId} (${grupo._count._all})`;
        })
        .join(', ');

      throw new ConflictException(
        `Estes profissionais têm agendamentos futuros: ${nomes}. Cancele ou realoque antes de desativá-los.`,
      );
    }

    await this.prisma.professional.updateMany({
      where: { id: { in: paraDesativar.map((p) => p.id) }, tenantId },
      data: { isActive: false },
    });

    return { deactivated: paraDesativar.length };
  }

  private async limitFor(tenantId: string): Promise<number | null> {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { plan: { select: { maxProfessionals: true } } },
    });

    return tenant.plan
      ? tenant.plan.maxProfessionals
      : await resolveTrialProfessionalLimit(this.prisma);
  }
}
