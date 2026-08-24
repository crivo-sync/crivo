import { Inject, Injectable } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';

import {
  APPOINTMENT_REPOSITORY,
  type AppointmentRepository,
} from 'src/modules/appointments/domain/repository/appointment.repository';

export type NoShowCost = {
  /** Quanto as faltas custaram no mês corrente, em centavos. */
  lostInCents: number;
  noShowCount: number;
  /** Atendimentos com desfecho conhecido — a base da taxa. */
  finishedCount: number;
  /** `null` quando não houve desfecho no mês: 0% seria mentira. */
  noShowRate: number | null;
  /**
   * Faltas evitadas: paciente de risco alto que **recebeu o lembrete extra
   * e compareceu**. É o mais perto de "o Crivo Sync salvou isso" que o dado
   * permite afirmar sem inventar.
   */
  savedCount: number;
  savedInCents: number;
};

/**
 * Quanto a falta custa em reais — a pergunta que o dono da clínica faz.
 *
 * O produto já media no-show em contagem e percentual; isso é linguagem de
 * produto. **Dono de clínica pensa em dinheiro**, e o dado para a conta já
 * existia: `Appointment.priceInCents` é o preço congelado no ato, então
 * somar os `NO_SHOW` do mês responde "quanto isso te custou".
 *
 * **O que este use case NÃO afirma:** "recuperado pela lista de espera".
 * Seria o número mais vendável, mas hoje a oferta de vaga não registra se
 * virou agendamento — `WaitlistEntry` vira `OFFERED` e para por aí. Dizer
 * "R$ X recuperados" sem esse vínculo seria inventar. O que dá para afirmar
 * é `savedCount`: paciente de risco alto que recebeu o lembrete escalonado
 * (D-72h + D-24h) e compareceu.
 */
@Injectable()
export class GetNoShowCostUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: AppointmentRepository,
  ) {}

  async execute(tenantId: string): Promise<NoShowCost> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const { data } = await this.appointmentRepository.findMany({
      tenantId,
      from: monthStart,
      to: now,
      page: 1,
      perPage: 500,
    });

    const noShows = data.filter(
      (appointment) => appointment.status === AppointmentStatus.NO_SHOW,
    );

    // Só desfecho conhecido entra na taxa: incluir `SCHEDULED` contaria como
    // presença um atendimento que ainda nem aconteceu.
    const finished = data.filter(
      (appointment) =>
        appointment.status === AppointmentStatus.NO_SHOW ||
        appointment.status === AppointmentStatus.COMPLETED,
    );

    /**
     * "Falta evitada" = compareceu **e** confirmou pelo WhatsApp.
     *
     * A confirmação é o sinal de que a comunicação funcionou: o paciente foi
     * alcançado, respondeu, e apareceu. Sem `confirmedAt` seria só "veio à
     * consulta", que aconteceria com ou sem o Crivo Sync.
     */
    const saved = data.filter(
      (appointment) =>
        appointment.status === AppointmentStatus.COMPLETED &&
        appointment.confirmedAt !== null,
    );

    const sum = (list: typeof data) =>
      list.reduce((total, item) => total + item.priceInCents, 0);

    return {
      lostInCents: sum(noShows),
      noShowCount: noShows.length,
      finishedCount: finished.length,
      noShowRate:
        finished.length > 0 ? noShows.length / finished.length : null,
      savedCount: saved.length,
      savedInCents: sum(saved),
    };
  }
}
