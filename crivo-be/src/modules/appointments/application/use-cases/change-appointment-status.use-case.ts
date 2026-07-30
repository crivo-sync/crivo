import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';

import {
  APPOINTMENT_REPOSITORY,
  type AppointmentRepository,
  type UpdateAppointmentData,
} from '../../domain/repository/appointment.repository';

export type ChangeAppointmentStatusInput = {
  id: string;
  tenantId: string;
  status: AppointmentStatus;
  cancelReason?: string;
};

/**
 * Máquina de estados do agendamento. COMPLETED, CANCELLED e NO_SHOW são
 * terminais: uma vez lá, o registro vira histórico e não muda mais — é esse
 * histórico que o modelo de predição vai consumir.
 */
const ALLOWED_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  [AppointmentStatus.SCHEDULED]: [
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.COMPLETED,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
  ],
  [AppointmentStatus.CONFIRMED]: [
    AppointmentStatus.COMPLETED,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
  ],
  [AppointmentStatus.COMPLETED]: [],
  [AppointmentStatus.CANCELLED]: [],
  [AppointmentStatus.NO_SHOW]: [],
};

@Injectable()
export class ChangeAppointmentStatusUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: AppointmentRepository,
  ) {}

  async execute({
    id,
    tenantId,
    status,
    cancelReason,
  }: ChangeAppointmentStatusInput) {
    const appointment = await this.appointmentRepository.findByIdAndTenant(
      id,
      tenantId,
    );

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado.');
    }

    if (appointment.status === status) {
      return appointment;
    }

    if (!ALLOWED_TRANSITIONS[appointment.status].includes(status)) {
      throw new BadRequestException(
        `Não é possível mudar de ${appointment.status} para ${status}.`,
      );
    }

    if (
      status === AppointmentStatus.NO_SHOW &&
      appointment.startsAt.getTime() > Date.now()
    ) {
      throw new BadRequestException(
        'Não é possível marcar falta em um agendamento que ainda não aconteceu.',
      );
    }

    const changes: UpdateAppointmentData = { status };

    if (status === AppointmentStatus.CONFIRMED) {
      changes.confirmedAt = new Date();
    }

    if (status === AppointmentStatus.CANCELLED) {
      changes.cancelledAt = new Date();
      changes.cancelReason = cancelReason ?? null;
    }

    return this.appointmentRepository.update(id, changes);
  }
}
