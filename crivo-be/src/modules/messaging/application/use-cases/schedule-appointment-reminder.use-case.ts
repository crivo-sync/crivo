import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessageType } from '@prisma/client';
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
import { MessageTemplateService } from '../services/message-template.service';

@Injectable()
export class ScheduleAppointmentReminderUseCase {
  private readonly logger = new Logger(ScheduleAppointmentReminderUseCase.name);

  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: MessageRepository,
    @InjectQueue(MESSAGING_QUEUE)
    private readonly queue: Queue<SendMessageJob>,
    private readonly prisma: PrismaService,
    private readonly templates: MessageTemplateService,
    private readonly config: ConfigService,
  ) {}

  private get hoursBefore(): number {
    return Number(this.config.get('REMINDER_HOURS_BEFORE') ?? 24);
  }

  /**
   * Agenda o lembrete de um atendimento. Chamado na criação e no reagendamento.
   * Se a consulta for antes da antecedência configurada, envia na hora.
   */
  async execute(appointmentId: string): Promise<void> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { select: { name: true, phone: true } },
        professional: { select: { name: true } },
        procedure: { select: { name: true } },
        tenant: { select: { name: true } },
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

    const body = this.templates.appointmentReminder({
      patientName: appointment.patient.name,
      clinicName: appointment.tenant.name,
      professionalName: appointment.professional.name,
      procedureName: appointment.procedure.name,
      startsAt: appointment.startsAt,
      confirmationToken,
    });

    const sendAt = new Date(
      appointment.startsAt.getTime() - this.hoursBefore * 3_600_000,
    );
    const delay = Math.max(0, sendAt.getTime() - Date.now());

    const message = await this.messageRepository.create({
      tenantId: appointment.tenantId,
      appointmentId: appointment.id,
      type: MessageType.APPOINTMENT_REMINDER,
      toPhone: appointment.patient.phone,
      body,
      scheduledFor: delay > 0 ? sendAt : new Date(),
    });

    await this.queue.add(
      'send',
      { messageId: message.id },
      { ...SEND_JOB_OPTIONS, delay },
    );

    this.logger.log(
      `Lembrete agendado para ${sendAt.toISOString()} (mensagem ${message.id})`,
    );
  }
}
