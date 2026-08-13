import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MessageType } from '@prisma/client';
import { Queue } from 'bullmq';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import {
  MESSAGE_REPOSITORY,
  type MessageRepository,
} from '../../domain/repository/message.repository';
import {
  MESSAGING_QUEUE,
  SEND_JOB_OPTIONS,
  SendMessageJob,
} from '../../infrastructure/queue/messaging.queue';

/**
 * Resposta manual da recepção a um paciente — o motivo de existir a tela de
 * conversa: até aqui, a caixa de entrada só permitia LER, e para responder
 * era preciso abrir o WhatsApp de verdade por fora do sistema.
 *
 * Reusa o mesmo trilho de confiabilidade das mensagens automáticas (fila
 * BullMQ, retry, franquia, Bull Board), em vez de um envio síncrono à parte:
 * o WhatsApp cai com a mesma frequência para uma resposta manual quanto para
 * um lembrete, e a recepção merece o mesmo fallback ("aparece em Falhas") nos
 * dois casos.
 */
@Injectable()
export class SendManualMessageUseCase {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: MessageRepository,
    @InjectQueue(MESSAGING_QUEUE)
    private readonly queue: Queue<SendMessageJob>,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    tenantId: string,
    patientId: string,
    body: string,
  ): Promise<void> {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, tenantId, deletedAt: null },
      select: { id: true, phone: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    const message = await this.messageRepository.create({
      tenantId,
      patientId,
      type: MessageType.MANUAL,
      toPhone: patient.phone,
      body,
      scheduledFor: new Date(),
    });

    await this.queue.add(
      'send',
      { messageId: message.id },
      { ...SEND_JOB_OPTIONS, jobId: message.id },
    );
  }
}
