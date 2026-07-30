import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  APPOINTMENT_REPOSITORY,
  type AppointmentRepository,
} from '../../domain/repository/appointment.repository';

@Injectable()
export class GetAppointmentByIdUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: AppointmentRepository,
  ) {}

  async execute(id: string, tenantId: string) {
    const appointment = await this.appointmentRepository.findByIdAndTenant(
      id,
      tenantId,
    );

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado.');
    }

    return appointment;
  }
}
