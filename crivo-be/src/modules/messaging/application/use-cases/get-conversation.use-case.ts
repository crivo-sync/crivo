import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import {
  MESSAGE_REPOSITORY,
  type MessageRepository,
} from '../../domain/repository/message.repository';
import {
  INBOUND_MESSAGE_REPOSITORY,
  type InboundMessageRepository,
} from '../../domain/repository/inbound-message.repository';

export type ConversationEntry =
  | { direction: 'OUT'; at: Date; message: Awaited<ReturnType<MessageRepository['findByPatient']>>[number] }
  | { direction: 'IN'; at: Date; message: Awaited<ReturnType<InboundMessageRepository['findByPatient']>>[number] };

/**
 * Junta envio (`Message`) e recebimento (`InboundMessage`) do mesmo paciente
 * numa única linha do tempo — hoje a recepção lê as duas em telas separadas
 * e precisa reconstruir a conversa de cabeça.
 *
 * Duas tabelas continuam existindo por bons motivos (uma tem fila e
 * tentativas, a outra não), então a junção acontece aqui, em memória, não no
 * schema. Custo aceitável: é o histórico de UM paciente, não do tenant
 * inteiro.
 */
@Injectable()
export class GetConversationUseCase {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: MessageRepository,
    @Inject(INBOUND_MESSAGE_REPOSITORY)
    private readonly inboundRepository: InboundMessageRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    tenantId: string,
    patientId: string,
  ): Promise<ConversationEntry[]> {
    // Mesma checagem usada no prontuário: paciente de outro tenant devolve
    // 404, não a conversa de outra clínica.
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    const [sent, received] = await Promise.all([
      this.messageRepository.findByPatient(tenantId, patientId),
      this.inboundRepository.findByPatient(tenantId, patientId),
    ]);

    const entries: ConversationEntry[] = [
      ...sent.map(
        (message): ConversationEntry => ({
          direction: 'OUT',
          at: message.createdAt,
          message,
        }),
      ),
      ...received.map(
        (message): ConversationEntry => ({
          direction: 'IN',
          at: message.sentAt,
          message,
        }),
      ),
    ];

    entries.sort((a, b) => a.at.getTime() - b.at.getTime());

    return entries;
  }
}
