import { Injectable } from '@nestjs/common';
import { MessageStatus } from '@prisma/client';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';

/**
 * Franquia do trial. Tenant em trial não tem `Plan`, então o teto vem
 * daqui — é regra de negócio, não configuração por clínica.
 *
 * 30 mensagens dão para percorrer o produto inteiro (marcar consulta,
 * receber o aviso, o lembrete e confirmar) sem operar a clínica de graça
 * por duas semanas. O custo por trial fica abaixo de R$3 em utility.
 */
export const TRIAL_MESSAGE_QUOTA = 30;

export type QuotaCheck =
  | { allowed: true }
  | { allowed: false; used: number; limit: number; isTrial: boolean };

/**
 * Uso do mês, para exibição — diferente de `QuotaCheck`, que só devolve
 * `used`/`limit` quando **já estourou** (é tudo que o `MessageProcessor`
 * precisa para decidir bloquear ou não). A tela de Assinatura precisa do
 * número mesmo dentro do limite, para mostrar "320 de 500 usadas".
 */
export type MessageUsage = {
  used: number;
  /** `null` = sem teto (plano Avançado). */
  limit: number | null;
  isTrial: boolean;
};

/**
 * Diz se a clínica ainda pode enviar mensagem neste mês.
 *
 * Conta só o que **já saiu** (`SENT`): mensagem na fila ainda pode ser
 * cancelada por reagendamento, e falha não gera custo. A Meta cobra por
 * conversa iniciada pela empresa — resposta a paciente dentro da janela
 * de 24h é gratuita e, por isso, `InboundMessage` nem entra na conta.
 */
@Injectable()
export class CheckMessageQuotaUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(tenantId: string): Promise<QuotaCheck> {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      include: { plan: true },
    });

    const isTrial = tenant.planId === null;
    const limit = isTrial
      ? TRIAL_MESSAGE_QUOTA
      : tenant.plan?.maxMessagesPerMonth;

    // Plano sem teto (o mais caro): nada a checar.
    if (limit == null) return { allowed: true };

    const used = await this.prisma.message.count({
      where: {
        tenantId,
        status: MessageStatus.SENT,
        sentAt: { gte: startOfMonth() },
      },
    });

    if (used < limit) return { allowed: true };

    return { allowed: false, used, limit, isTrial };
  }

  /** Sempre devolve o número usado, esteja dentro ou fora do limite. */
  async usage(tenantId: string): Promise<MessageUsage> {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      include: { plan: true },
    });

    const isTrial = tenant.planId === null;
    const limit = isTrial
      ? TRIAL_MESSAGE_QUOTA
      : (tenant.plan?.maxMessagesPerMonth ?? null);

    const used = await this.prisma.message.count({
      where: {
        tenantId,
        status: MessageStatus.SENT,
        sentAt: { gte: startOfMonth() },
      },
    });

    return { used, limit, isTrial };
  }
}

/** Primeiro instante do mês corrente, no fuso local do servidor. */
function startOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}
