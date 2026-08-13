import { Injectable } from '@nestjs/common';
import { InboundMessage, Prisma } from '@prisma/client';

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

    const [data, total, unreadTotal] = await this.prisma.$transaction([
      this.prisma.inboundMessage.findMany({
        where,
        include: RELATIONS,
        // Mais recente primeiro: numa caixa de entrada o que acabou de chegar
        // é o que importa.
        orderBy: { sentAt: 'desc' },
        skip: (params.page - 1) * params.perPage,
        take: params.perPage,
      }),
      this.prisma.inboundMessage.count({ where }),
      // Sem o filtro do usuário de propósito: o badge conta tudo que falta
      // ler no tenant, não o que sobrou do filtro aplicado na tela.
      this.prisma.inboundMessage.count({
        where: { tenantId: params.tenantId, readAt: null },
      }),
    ]);

    return { data, total, unreadTotal };
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

  findByPatient(tenantId: string, patientId: string): Promise<InboundMessage[]> {
    return this.prisma.inboundMessage.findMany({
      where: { tenantId, patientId },
      orderBy: { sentAt: 'asc' },
    });
  }
}
