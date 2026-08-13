import { Inject, Injectable } from '@nestjs/common';

import {
  APPOINTMENT_REPOSITORY,
  type AppointmentRepository,
} from '../../domain/repository/appointment.repository';

/**
 * Quantos agendamentos entraram depois de um instante.
 *
 * Alimenta o aviso de "chegou alguém" na Agenda. É um contador separado da
 * listagem porque a lista é ordenada por **data de atendimento**: quem marca
 * hoje para daqui a duas semanas cai numa página posterior, e a recepção que
 * está na página 1 nunca veria a chegada. Contar no banco resolve isso sem
 * mexer na ordenação, que a recepção espera cronológica.
 */
@Injectable()
export class CountNewAppointmentsUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: AppointmentRepository,
  ) {}

  execute(tenantId: string, since: Date): Promise<number> {
    return this.appointmentRepository.countCreatedAfter(tenantId, since);
  }
}
