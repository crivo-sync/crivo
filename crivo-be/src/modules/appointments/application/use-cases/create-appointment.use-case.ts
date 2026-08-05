import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { ScheduleAppointmentReminderUseCase } from 'src/modules/messaging/application/use-cases/schedule-appointment-reminder.use-case';
import {
  APPOINTMENT_REPOSITORY,
  type AppointmentRepository,
} from '../../domain/repository/appointment.repository';
import { BusinessHoursService } from '../services/business-hours.service';
import { ProfessionalAvailabilityService } from '../services/professional-availability.service';

export type CreateAppointmentInput = {
  tenantId: string;
  patientId: string;
  professionalId: string;
  procedureId: string;
  startsAt: Date;
  notes?: string;
};

@Injectable()
export class CreateAppointmentUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: AppointmentRepository,
    private readonly prisma: PrismaService,
    private readonly scheduleReminder: ScheduleAppointmentReminderUseCase,
    private readonly businessHours: BusinessHoursService,
    private readonly professionalAvailability: ProfessionalAvailabilityService,
  ) {}

  async execute(input: CreateAppointmentInput) {
    if (input.startsAt.getTime() < Date.now()) {
      throw new BadRequestException(
        'Não é possível agendar em um horário no passado.',
      );
    }

    // Buscar os três com filtro de tenant garante que a recepção não consiga
    // agendar usando o paciente ou o profissional de outra clínica.
    const [patient, professional, procedure] = await Promise.all([
      this.prisma.patient.findFirst({
        where: {
          id: input.patientId,
          tenantId: input.tenantId,
          deletedAt: null,
        },
        select: { id: true },
      }),
      this.prisma.professional.findFirst({
        where: {
          id: input.professionalId,
          tenantId: input.tenantId,
          deletedAt: null,
          isActive: true,
        },
        select: { id: true, procedures: { select: { id: true } } },
      }),
      this.prisma.procedure.findFirst({
        where: {
          id: input.procedureId,
          tenantId: input.tenantId,
          deletedAt: null,
          isActive: true,
        },
        select: { id: true, durationMinutes: true, priceInCents: true },
      }),
    ]);

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    if (!professional) {
      throw new NotFoundException('Profissional não encontrado ou inativo.');
    }

    if (!procedure) {
      throw new NotFoundException('Procedimento não encontrado ou inativo.');
    }

    // Lista vazia = profissional sem restrição, faz qualquer procedimento.
    if (
      professional.procedures.length > 0 &&
      !professional.procedures.some((p) => p.id === input.procedureId)
    ) {
      throw new BadRequestException(
        'Este profissional não realiza este procedimento.',
      );
    }

    // A duração vem do procedimento — a recepção escolhe o que será feito,
    // não quanto tempo leva.
    const endsAt = new Date(
      input.startsAt.getTime() + procedure.durationMinutes * 60_000,
    );

    await this.businessHours.assertWithinBusinessHours(
      input.tenantId,
      input.startsAt,
      endsAt,
    );

    // Expediente da clínica é o teto; a grade do profissional recorta dentro
    // dele. Clínica aberta 08–18 não significa que este profissional atende
    // às 17h.
    await this.professionalAvailability.assertAvailable(
      input.professionalId,
      input.tenantId,
      input.startsAt,
      endsAt,
    );

    const conflict = await this.appointmentRepository.findOverlapping({
      tenantId: input.tenantId,
      professionalId: input.professionalId,
      startsAt: input.startsAt,
      endsAt,
    });

    if (conflict) {
      throw new ConflictException(
        'Este profissional já tem um agendamento neste horário.',
      );
    }

    const appointment = await this.appointmentRepository.create({
      tenantId: input.tenantId,
      patientId: input.patientId,
      professionalId: input.professionalId,
      procedureId: input.procedureId,
      startsAt: input.startsAt,
      endsAt,
      // Congela o preço praticado: a tabela pode mudar, o histórico não.
      priceInCents: procedure.priceInCents,
      notes: input.notes ?? null,
    });

    await this.scheduleReminder.execute(appointment.id);

    return appointment;
  }
}
