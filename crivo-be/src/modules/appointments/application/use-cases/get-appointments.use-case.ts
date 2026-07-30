import { Inject, Injectable } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';

import {
  APPOINTMENT_REPOSITORY,
  type AppointmentRepository,
} from '../../domain/repository/appointment.repository';

export type GetAppointmentsInput = {
  tenantId: string;
  from?: Date;
  to?: Date;
  professionalId?: string;
  patientId?: string;
  status?: AppointmentStatus;
  page: number;
  perPage: number;
};

@Injectable()
export class GetAppointmentsUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: AppointmentRepository,
  ) {}

  execute(input: GetAppointmentsInput) {
    return this.appointmentRepository.findMany(input);
  }
}
