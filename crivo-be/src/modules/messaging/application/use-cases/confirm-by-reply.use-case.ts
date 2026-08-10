import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  AppointmentStatus,
  MessageStatus,
  MessageType,
  ReplyIntent,
} from '@prisma/client';
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
import { MessageTemplateService } from '../services/message-template.service';
import { detectReplyIntent } from '../services/reply-intent';

export type ConfirmByReplyResult = {
  intent: ReplyIntent;
  /** Agendamento afetado, quando houve um. */
  appointmentId: string | null;
  /** `true` só quando esta resposta mudou o status para `CONFIRMED`. */
  confirmed: boolean;
};

/**
 * Confirmação de presença respondendo o lembrete no WhatsApp.
 *
 * O link `/c/:token` continua existindo, mas exige abrir o navegador — e o
 * paciente que já está no WhatsApp simplesmente responde "sim". Sem isto,
 * essa resposta ficava registrada e ignorada, e a clínica seguia achando que
 * ninguém confirmou.
 *
 * A resposta não carrega token: quem determina o agendamento é o telefone de
 * origem. Por isso a busca é deliberadamente estreita (ver `findTarget`).
 */
@Injectable()
export class ConfirmByReplyUseCase {
  private readonly logger = new Logger(ConfirmByReplyUseCase.name);

  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: MessageRepository,
    @InjectQueue(MESSAGING_QUEUE)
    private readonly queue: Queue<SendMessageJob>,
    private readonly prisma: PrismaService,
    private readonly templates: MessageTemplateService,
  ) {}

  async execute(input: {
    tenantId: string;
    patientId: string | null;
    body: string;
  }): Promise<ConfirmByReplyResult> {
    const intent = detectReplyIntent(input.body);

    // Sem paciente vinculado não há como saber de qual agenda a resposta
    // fala — mesmo que o texto seja um "sim" claro.
    if (intent === 'UNKNOWN' || !input.patientId) {
      return { intent, appointmentId: null, confirmed: false };
    }

    const appointment = await this.findTarget(input.tenantId, input.patientId);

    if (!appointment) {
      return { intent, appointmentId: null, confirmed: false };
    }

    // `CANCEL` **não** cancela sozinho: só marca o agendamento na resposta
    // para a recepção ver. Cancelar libera o horário e cobra política de
    // remarcação — decisão da clínica, não de um casamento de texto.
    if (intent === 'CANCEL') {
      this.logger.log(
        `Paciente pediu cancelamento por WhatsApp (agendamento ${appointment.id}) — sinalizado para a recepção.`,
      );
      return { intent, appointmentId: appointment.id, confirmed: false };
    }

    if (appointment.status === AppointmentStatus.CONFIRMED) {
      // Responder "sim" duas vezes não é erro nem gera segundo recibo.
      return { intent, appointmentId: appointment.id, confirmed: false };
    }

    await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: AppointmentStatus.CONFIRMED,
        confirmedAt: new Date(),
      },
    });

    await this.sendReceipt(appointment);

    this.logger.log(
      `Agendamento ${appointment.id} confirmado por resposta no WhatsApp.`,
    );

    return { intent, appointmentId: appointment.id, confirmed: true };
  }

  /**
   * O agendamento a que a resposta se refere.
   *
   * Regras, todas restritivas de propósito:
   * - **só futuro** — "sim" não confirma consulta que já passou;
   * - **só `SCHEDULED`/`CONFIRMED`** — cancelado ou concluído não volta atrás
   *   por mensagem;
   * - **o mais próximo primeiro** — é o que o lembrete acabou de mencionar;
   * - **só se houver aviso criado** para ele. Sem isso, um "ok" solto
   *   (resposta a outra conversa, ou mensagem espontânea) confirmaria a
   *   próxima consulta que o paciente tivesse na agenda.
   *
   * A última condição olha a **existência** da mensagem, não o `sentAt`.
   * Exigir envio confirmado parecia mais rigoroso, mas quebrava exatamente
   * quando mais importa: com o WhatsApp da clínica instável as mensagens
   * ficam `PENDING`, e o paciente que respondesse "sim" pelo histórico da
   * conversa era ignorado em silêncio — a clínica seguia achando que ninguém
   * confirmou. Mensagem `CANCELLED` fica de fora porque pertence a um
   * agendamento que foi remarcado.
   */
  private async findTarget(tenantId: string, patientId: string) {
    return this.prisma.appointment.findFirst({
      where: {
        tenantId,
        patientId,
        startsAt: { gte: new Date() },
        status: {
          in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
        },
        messages: {
          some: {
            type: {
              in: [
                MessageType.APPOINTMENT_REMINDER,
                MessageType.APPOINTMENT_BOOKED,
              ],
            },
            status: { not: MessageStatus.CANCELLED },
          },
        },
      },
      orderBy: { startsAt: 'asc' },
      include: {
        patient: { select: { phone: true } },
        tenant: { select: { name: true } },
      },
    });
  }

  private async sendReceipt(appointment: {
    id: string;
    tenantId: string;
    patient: { phone: string };
    tenant: { name: string };
  }): Promise<void> {
    const receipt = await this.messageRepository.create({
      tenantId: appointment.tenantId,
      appointmentId: appointment.id,
      type: MessageType.APPOINTMENT_CONFIRMATION_RECEIPT,
      toPhone: appointment.patient.phone,
      body: this.templates.confirmationReceipt(appointment.tenant.name),
    });

    await this.queue.add('send', { messageId: receipt.id }, SEND_JOB_OPTIONS);
  }
}
