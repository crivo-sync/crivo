import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessageStatus, MessageType } from '@prisma/client';
import { Queue } from 'bullmq';
import { randomBytes } from 'node:crypto';

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
import { MessageComposerService } from '../services/message-composer.service';
import { AssessAppointmentRiskUseCase } from 'src/modules/prediction/application/assess-appointment-risk.use-case';
import type { RiskLevel } from 'src/modules/prediction/domain/no-show-risk';
import { MessageTemplateService } from '../services/message-template.service';
import { planReminders } from '../services/reminder-schedule';

@Injectable()
export class ScheduleAppointmentReminderUseCase {
  private readonly logger = new Logger(ScheduleAppointmentReminderUseCase.name);

  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: MessageRepository,
    @InjectQueue(MESSAGING_QUEUE)
    private readonly queue: Queue<SendMessageJob>,
    private readonly prisma: PrismaService,
    private readonly composer: MessageComposerService,
    private readonly templates: MessageTemplateService,
    private readonly config: ConfigService,
    private readonly assessRisk: AssessAppointmentRiskUseCase,
  ) {}

  private get hoursBefore(): number {
    return Number(this.config.get('REMINDER_HOURS_BEFORE') ?? 24);
  }

  /**
   * Agenda o lembrete de um atendimento. Chamado na criação e no reagendamento.
   * Se a consulta for antes da antecedência configurada, envia na hora.
   */
  async execute(appointmentId: string, rescheduled = false): Promise<void> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { select: { name: true, phone: true } },
        professional: { select: { name: true } },
        procedure: { select: { name: true } },
        tenant: { select: { name: true, aiMessagesEnabled: true } },
      },
    });

    if (!appointment) {
      return;
    }

    // Token opaco: é a única credencial do paciente para confirmar sem login.
    const confirmationToken =
      appointment.confirmationToken ?? randomBytes(24).toString('hex');

    if (!appointment.confirmationToken) {
      await this.prisma.appointment.update({
        where: { id: appointment.id },
        data: { confirmationToken },
      });
    }

    const body = await this.composer.composeReminder({
      tenantId: appointment.tenantId,
      patientName: appointment.patient.name,
      clinicName: appointment.tenant.name,
      professionalName: appointment.professional.name,
      procedureName: appointment.procedure.name,
      startsAt: appointment.startsAt,
      confirmationToken,
      aiMessagesEnabled: appointment.tenant.aiMessagesEnabled,
    });

    /**
     * Quantos lembretes, e quando, dependem do risco de falta — é aqui que a
     * predição vira ação em vez de um número numa tela. Risco alto recebe um
     * lembrete cedo (dá tempo de a clínica reagir ao silêncio) e outro na
     * véspera; risco baixo mantém o único de sempre.
     *
     * A falha do cálculo não pode travar o envio: sem risco, cai no
     * cronograma padrão e o paciente recebe o lembrete como antes.
     */
    let level: RiskLevel = 'LOW';

    try {
      const risk = await this.assessRisk.forAppointment(
        appointment.id,
        appointment.tenantId,
      );
      level = risk.level;
    } catch (error) {
      this.logger.warn(
        `Não foi possível calcular o risco do agendamento ${appointment.id}: ${
          error instanceof Error ? error.message : 'erro desconhecido'
        }. Usando o cronograma padrão.`,
      );
    }

    const planned = planReminders(
      level,
      appointment.startsAt,
      this.hoursBefore,
    );

    for (const reminder of planned) {
      const message = await this.messageRepository.create({
        tenantId: appointment.tenantId,
        appointmentId: appointment.id,
        type: MessageType.APPOINTMENT_REMINDER,
        toPhone: appointment.patient.phone,
        body,
        scheduledFor: reminder.delay > 0 ? reminder.sendAt : new Date(),
      });

      // `jobId` = id da mensagem: torna o job endereçável para cancelar
      // quando o agendamento é remarcado (ver `cancelPending`).
      await this.queue.add(
        'send',
        { messageId: message.id },
        { ...SEND_JOB_OPTIONS, delay: reminder.delay, jobId: message.id },
      );
    }

    this.logger.log(
      `Risco ${level}: ${planned.length} lembrete(s) agendado(s) para o atendimento ${appointment.id} ` +
        `(${planned.map((r) => `D-${r.hoursBefore}h`).join(', ')})`,
    );

    // Só faz sentido avisar agora se o primeiro lembrete ainda está longe.
    // Quando a consulta é logo ali, o lembrete já sai imediatamente — mandar
    // os dois seria duas mensagens quase idênticas com segundos de diferença.
    if (planned[0].delay > 0) {
      await this.sendBookedNotice(appointment, confirmationToken, rescheduled);
    }
  }

  /**
   * Aviso imediato de "sua consulta foi marcada". Existe porque quem agenda
   * com dias de antecedência ficava sem nenhum contato até o D-1 — e sem
   * poder confirmar, já que o link só chegava com o lembrete.
   *
   * **Nunca passa pela IA**, de propósito: o texto promete "enviaremos um
   * lembrete um dia antes", e essa é uma afirmação sobre o comportamento do
   * sistema que a IA não deve reescrever nem omitir.
   *
   * Aceita, sim, o template personalizado da clínica — ali quem escreve é
   * uma pessoa que sabe o que a clínica faz, não um gerador de texto.
   */
  private async sendBookedNotice(
    appointment: {
      id: string;
      tenantId: string;
      startsAt: Date;
      patient: { name: string; phone: string };
      professional: { name: string };
      procedure: { name: string };
      tenant: { name: string };
    },
    confirmationToken: string,
    rescheduled: boolean,
  ): Promise<void> {
    const body = await this.templates.renderBooked(
      appointment.tenantId,
      {
        patientName: appointment.patient.name,
        clinicName: appointment.tenant.name,
        professionalName: appointment.professional.name,
        procedureName: appointment.procedure.name,
        startsAt: appointment.startsAt,
        confirmationToken,
      },
      { rescheduled },
    );

    const message = await this.messageRepository.create({
      tenantId: appointment.tenantId,
      appointmentId: appointment.id,
      type: MessageType.APPOINTMENT_BOOKED,
      toPhone: appointment.patient.phone,
      body,
      scheduledFor: new Date(),
    });

    await this.queue.add(
      'send',
      { messageId: message.id },
      {
        ...SEND_JOB_OPTIONS,
        jobId: message.id,
      },
    );

    this.logger.log(
      `Aviso de agendamento enviado na hora (mensagem ${message.id})`,
    );
  }

  /**
   * Chamado quando o agendamento é remarcado.
   *
   * Sem isso, o lembrete antigo continuava na fila **com a data velha no
   * texto** — o paciente recebia a informação errada na véspera da data
   * original. Descarta o que ainda não saiu e reagenda do zero com os dados
   * atuais (data, hora e profissional podem ter mudado).
   */
  async reschedule(appointmentId: string): Promise<void> {
    await this.cancelPending(appointmentId);
    await this.execute(appointmentId, true);
  }

  /**
   * Chamado quando o agendamento é cancelado.
   *
   * Sem isto o paciente que desmarcou continuava recebendo o lembrete da
   * consulta que não existe mais — pior que não avisar, porque ele pode
   * aparecer na clínica.
   */
  async cancelScheduled(appointmentId: string): Promise<void> {
    await this.cancelPending(appointmentId);
  }

  /**
   * Tira da fila e marca como `CANCELLED` toda mensagem que ainda não saiu.
   * O que já foi enviado é histórico e não se toca.
   */
  private async cancelPending(appointmentId: string): Promise<void> {
    const pending = await this.prisma.message.findMany({
      where: { appointmentId, status: MessageStatus.PENDING },
      select: { id: true },
    });

    for (const message of pending) {
      // O job pode já ter saído da fila (executando, ou de antes de existir
      // `jobId` fixo). Não conseguir remover não é erro: o guard de
      // idempotência do worker impede envio duplicado de qualquer forma.
      try {
        await this.queue.remove(message.id);
      } catch {
        this.logger.warn(
          `Job da mensagem ${message.id} não pôde ser removido da fila — seguirá ignorado no worker.`,
        );
      }
    }

    if (pending.length === 0) return;

    await this.prisma.message.updateMany({
      where: { id: { in: pending.map((message) => message.id) } },
      data: { status: MessageStatus.CANCELLED },
    });

    this.logger.log(
      `${pending.length} mensagem(ns) pendente(s) cancelada(s) por reagendamento do atendimento ${appointmentId}`,
    );
  }
}
