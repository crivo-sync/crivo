import { Injectable } from '@nestjs/common';
import { InboundMessage, Prisma, ReplyIntent } from '@prisma/client';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import type {
  FindManyInboundParams,
  InboundMessageRepository,
  PaginatedInboundMessages,
} from '../../domain/repository/inbound-message.repository';

const RELATIONS = {
  patient: { select: { id: true, name: true, phone: true } },
  appointment: { select: { id: true, startsAt: true } },
} satisfies Prisma.InboundMessageInclude;

@Injectable()
export class PrismaInboundMessageRepository implements InboundMessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    params: FindManyInboundParams,
  ): Promise<PaginatedInboundMessages> {
    const where: Prisma.InboundMessageWhereInput = {
      tenantId: params.tenantId,
      ...(params.unreadOnly === true ? { readAt: null } : {}),
      ...(params.unreadOnly === false ? { readAt: { not: null } } : {}),
      ...(params.intent ? { intent: params.intent } : {}),
    };

    /**
     * Cancelamento não lido primeiro, resto depois — dentro de cada grupo,
     * mais recente primeiro. Antes era só `sentAt desc`: um "quer cancelar"
     * de ontem ficava enterrado atrás de uma pergunta de hoje, sem nenhuma
     * pista de que um pesa mais que o outro.
     *
     * O Prisma não ordena por enum arbitrário (`orderBy: { intent: {...} }`
     * só existe para relação/JSON — testado e confirmado que não aceita
     * enum), e o projeto não usa `$queryRaw` em lugar nenhum. A solução é
     * **duas queries concatenadas na primeira página**, não paginação real
     * entre os dois grupos: a tela (`MessageManagement`) sempre pede
     * `page: 1, perPage: 50` e nunca vira de página de verdade — resolver
     * "skip cruzando a fronteira entre grupos" para uma paginação que não
     * existe na prática seria complexidade sem uso.
     *
     * Só entra em jogo na página 1 com filtro compatível (senão os dois
     * grupos colapsam num só, e não há o que priorizar).
     */
    const prioritizaCancelamento =
      params.page === 1 &&
      params.unreadOnly !== false &&
      (!params.intent || params.intent === ReplyIntent.CANCEL);

    const data = prioritizaCancelamento
      ? await this.findFirstPagePrioritizingCancel(where, params)
      : await this.prisma.inboundMessage.findMany({
          where,
          include: RELATIONS,
          orderBy: { sentAt: 'desc' },
          skip: (params.page - 1) * params.perPage,
          take: params.perPage,
        });

    const [total, unreadTotal, unreadCancelTotal] = await Promise.all([
      this.prisma.inboundMessage.count({ where }),
      // Sem o filtro do usuário de propósito: o badge conta tudo que falta
      // ler no tenant, não o que sobrou do filtro aplicado na tela.
      this.prisma.inboundMessage.count({
        where: { tenantId: params.tenantId, readAt: null },
      }),
      this.prisma.inboundMessage.count({
        where: {
          tenantId: params.tenantId,
          readAt: null,
          intent: ReplyIntent.CANCEL,
        },
      }),
    ]);

    return { data, total, unreadTotal, unreadCancelTotal };
  }

  /** Preenche a página com cancelamento não lido, completando com o resto. */
  private async findFirstPagePrioritizingCancel(
    where: Prisma.InboundMessageWhereInput,
    params: FindManyInboundParams,
  ) {
    const cancelWhere: Prisma.InboundMessageWhereInput = {
      ...where,
      readAt: null,
      intent: ReplyIntent.CANCEL,
    };

    const cancelPart = await this.prisma.inboundMessage.findMany({
      where: cancelWhere,
      include: RELATIONS,
      orderBy: { sentAt: 'desc' },
      take: params.perPage,
    });

    if (cancelPart.length >= params.perPage) return cancelPart;

    const restPart = await this.prisma.inboundMessage.findMany({
      where: { ...where, NOT: { id: { in: cancelPart.map((m) => m.id) } } },
      include: RELATIONS,
      orderBy: { sentAt: 'desc' },
      take: params.perPage - cancelPart.length,
    });

    return [...cancelPart, ...restPart];
  }

  async markAsRead(
    id: string,
    tenantId: string,
  ): Promise<InboundMessage | null> {
    // `updateMany` com o tenant no `where` (em vez de `update` por id) é o que
    // impede uma clínica de marcar mensagem de outra sabendo o UUID.
    const { count } = await this.prisma.inboundMessage.updateMany({
      where: { id, tenantId, readAt: null },
      data: { readAt: new Date() },
    });

    if (count === 0) {
      // Ou não existe, ou é de outro tenant, ou já estava lida — os três
      // casos são indistinguíveis de propósito para quem chama.
      return this.prisma.inboundMessage.findFirst({ where: { id, tenantId } });
    }

    return this.prisma.inboundMessage.findUnique({ where: { id } });
  }

  async markAllAsRead(tenantId: string): Promise<number> {
    const { count } = await this.prisma.inboundMessage.updateMany({
      where: { tenantId, readAt: null },
      data: { readAt: new Date() },
    });

    return count;
  }

  findByPatient(
    tenantId: string,
    patientId: string,
  ): Promise<InboundMessage[]> {
    return this.prisma.inboundMessage.findMany({
      where: { tenantId, patientId },
      orderBy: { sentAt: 'asc' },
    });
  }
}
