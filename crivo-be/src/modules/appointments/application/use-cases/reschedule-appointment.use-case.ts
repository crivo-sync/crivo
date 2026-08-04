import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import {
  APPOINTMENT_REPOSITORY,
  type AppointmentRepository,
} from '../../domain/repository/appointment.repository';
import { BusinessHoursService } from '../services/business-hours.service';

export type RescheduleAppointmentInput = {
  id: string;
  tenantId: string;
  startsAt: Date;
  professionalId?: string;
  notes?: string;
};

const REOPENABLE: AppointmentStatus[] = [
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.CONFIRMED,
];

@Injectable()
export class RescheduleAppointmentUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: AppointmentRepository,
    private readonly prisma: PrismaService,
    private readonly businessHours: BusinessHoursService,
  ) {}

  async execute(input: RescheduleAppointmentInput) {
    const appointment = await this.appointmentRepository.findByIdAndTenant(
      input.id,
      input.tenantId,
    );

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado.');
    }

    if (!REOPENABLE.includes(appointment.status)) {
      throw new BadRequestException(
        `Não é possível reagendar um atendimento com status ${appointment.status}.`,
      );
    }

    if (input.startsAt.getTime() < Date.now()) {
      throw new BadRequestException(
        'Não é possível agendar em um horário no passado.',
      );
    }

    const professionalId = input.professionalId ?? appointment.professionalId;

    if (input.professionalId) {
      const professional = await this.prisma.professional.findFirst({
        where: {
          id: input.professionalId,
          tenantId: input.tenantId,
          deletedAt: null,
          isActive: true,
        },
        select: { id: true, procedures: { select: { id: true } } },
      });

      if (!professional) {
        throw new NotFoundException('Profissional não encontrado ou inativo.');
      }

      // O procedimento não muda ao reagendar — só confere se o novo
      // profissional também realiza o procedimento já marcado.
      if (
        professional.procedures.length > 0 &&
        !professional.procedures.some((p) => p.id === appointment.procedureId)
      ) {
        throw new BadRequestException(
          'Este profissional não realiza este procedimento.',
        );
      }
    }

    // Mantém a duração original do procedimento já escolhido.
    const durationMs =
      appointment.endsAt.getTime() - appointment.startsAt.getTime();
    const endsAt = new Date(input.startsAt.getTime() + durationMs);

    await this.businessHours.assertWithinBusinessHours(
      input.tenantId,
      input.startsAt,
      endsAt,
    );

    const conflict = await this.appointmentRepository.findOverlapping({
      tenantId: input.tenantId,
      professionalId,
      startsAt: input.startsAt,
      endsAt,
      excludeAppointmentId: appointment.id,
    });

    if (conflict) {
      throw new ConflictException(
        'Este profissional já tem um agendamento neste horário.',
      );
    }

    return this.appointmentRepository.update(appointment.id, {
      startsAt: input.startsAt,
      endsAt,
      professionalId,
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    });
  }
}
