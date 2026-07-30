import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, MessageType } from '@prisma/client';
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

/**
 * Confirmação feita pelo próprio paciente, sem login. O token do link é a
 * credencial — por isso ele é opaco, único e só serve para este agendamento.
 *
 * Não recebe `tenantId`: o token já determina de qual clínica é o agendamento.
 */
@Injectable()
export class ConfirmByTokenUseCase {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: MessageRepository,
    @InjectQueue(MESSAGING_QUEUE)
    private readonly queue: Queue<SendMessageJob>,
    private readonly prisma: PrismaService,
    private readonly templates: MessageTemplateService,
  ) {}

  async execute(token: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { confirmationToken: token },
      include: {
        patient: { select: { name: true, phone: true } },
        professional: { select: { name: true } },
        procedure: { select: { name: true } },
        tenant: { select: { name: true } },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Link de confirmação inválido ou expirado.');
    }

    if (appointment.status === AppointmentStatus.CONFIRMED) {
      return { alreadyConfirmed: true, appointment };
    }

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException(
        'Este agendamento não pode mais ser confirmado. Entre em contato com a clínica.',
      );
    }

    const updated = await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: AppointmentStatus.CONFIRMED,
        confirmedAt: new Date(),
      },
    });

    // Recibo para o paciente: confirma que a clínica recebeu.
    const receipt = await this.messageRepository.create({
      tenantId: appointment.tenantId,
      appointmentId: appointment.id,
      type: MessageType.APPOINTMENT_CONFIRMATION_RECEIPT,
      toPhone: appointment.patient.phone,
      body: this.templates.confirmationReceipt(appointment.tenant.name),
    });

    await this.queue.add('send', { messageId: receipt.id }, SEND_JOB_OPTIONS);

    return {
      alreadyConfirmed: false,
      appointment: { ...appointment, ...updated },
    };
  }
}
