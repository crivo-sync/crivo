import { Inject, Injectable } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';

import {
  APPOINTMENT_REPOSITORY,
  type AppointmentRepository,
} from 'src/modules/appointments/domain/repository/appointment.repository';
import {
  PATIENT_REPOSITORY,
  type PatientRepository,
} from 'src/modules/patients/domain/repository/patient.repository';
import {
  PROFESSIONAL_REPOSITORY,
  type ProfessionalRepository,
} from 'src/modules/professionals/domain/repository/professional.repository';
import {
  PROCEDURE_REPOSITORY,
  type ProcedureRepository,
} from 'src/modules/procedures/domain/repository/procedure.repository';
import {
  MESSAGE_REPOSITORY,
  type MessageRepository,
} from 'src/modules/messaging/domain/repository/message.repository';

/** Janela para "a confirmar": agendamentos SCHEDULED que começam nas próximas N horas. */
const UPCOMING_UNCONFIRMED_HOURS = 48;

@Injectable()
export class GetDashboardSummaryUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: AppointmentRepository,
    @Inject(PATIENT_REPOSITORY)
    private readonly patientRepository: PatientRepository,
    @Inject(PROFESSIONAL_REPOSITORY)
    private readonly professionalRepository: ProfessionalRepository,
    @Inject(PROCEDURE_REPOSITORY)
    private readonly procedureRepository: ProcedureRepository,
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: MessageRepository,
  ) {}

  async execute(tenantId: string) {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    const upcomingWindowEnd = new Date(
      now.getTime() + UPCOMING_UNCONFIRMED_HOURS * 60 * 60 * 1000,
    );

    const [
      appointmentsToday,
      upcomingUnconfirmed,
      failedMessages,
      patientsTotal,
      activeProfessionalsTotal,
      proceduresTotal,
    ] = await Promise.all([
      this.appointmentRepository.findMany({
        tenantId,
        from: todayStart,
        to: todayEnd,
        page: 1,
        perPage: 100,
      }),
      this.appointmentRepository.findMany({
        tenantId,
        status: AppointmentStatus.SCHEDULED,
        from: now,
        to: upcomingWindowEnd,
        page: 1,
        perPage: 100,
      }),
      this.messageRepository.findMany({
        tenantId,
        status: 'FAILED',
        page: 1,
        perPage: 20,
      }),
      this.patientRepository.findMany({ tenantId, page: 1, perPage: 1 }),
      this.professionalRepository.countActiveByTenant(tenantId),
      this.procedureRepository.findMany({ tenantId, page: 1, perPage: 1 }),
    ]);

    return {
      appointmentsToday: appointmentsToday.data,
      upcomingUnconfirmed: upcomingUnconfirmed.data,
      failedMessages: failedMessages.data,
      counts: {
        appointmentsToday: appointmentsToday.total,
        upcomingUnconfirmed: upcomingUnconfirmed.total,
        failedMessages: failedMessages.total,
        patients: patientsTotal.total,
        activeProfessionals: activeProfessionalsTotal,
        procedures: proceduresTotal.total,
      },
    };
  }
}
