import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';

export type OnboardingStatus = {
  hasProfessional: boolean;
  hasProcedure: boolean;
  hasAppointment: boolean;
  /** Subdomínio para montar o link do `/agendar` que a clínica divulga. */
  subdomain: string;
  /** Os três primeiros cumpridos — a partir daí o checklist some da tela. */
  isComplete: boolean;
};

/**
 * O que ainda falta para a clínica sair do zero.
 *
 * Clínica criada pelo cadastro self-service nasce **sem profissional e sem
 * procedimento**, e sem os dois nada funciona: a agenda não calcula horário
 * livre e a página `/agendar` que ela divulga responde "Agenda ainda não
 * disponível". Até aqui nada no painel dizia isso — a clínica descobria pelo
 * paciente reclamando que o link não funciona.
 *
 * **Os filtros aqui têm que ser os mesmos de `booking-options`** (público):
 * profissional `isActive` e não excluído, procedimento `isActive`. Se
 * divergirem, o checklist diz "tudo pronto" enquanto a página pública segue
 * recusando — que é exatamente o problema que ele existe para evitar.
 */
@Injectable()
export class GetOnboardingStatusUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(tenantId: string): Promise<OnboardingStatus> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { subdomain: true },
    });

    if (!tenant) {
      throw new NotFoundException('Clínica não encontrada.');
    }

    const [professionals, procedures, appointments] = await Promise.all([
      this.prisma.professional.count({
        where: { tenantId, isActive: true, deletedAt: null },
      }),
      this.prisma.procedure.count({ where: { tenantId, isActive: true } }),
      this.prisma.appointment.count({ where: { tenantId } }),
    ]);

    const hasProfessional = professionals > 0;
    const hasProcedure = procedures > 0;

    return {
      hasProfessional,
      hasProcedure,
      hasAppointment: appointments > 0,
      subdomain: tenant.subdomain,
      // O link do `/agendar` não entra no cálculo: divulgar é ação fora do
      // sistema, e não temos como saber se aconteceu. Marcar "pendente" para
      // sempre deixaria o checklist eterno na tela.
      isComplete: hasProfessional && hasProcedure && appointments > 0,
    };
  }
}
