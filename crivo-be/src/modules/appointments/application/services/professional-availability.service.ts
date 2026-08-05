import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';

const WEEKDAY_LABELS = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
];

export type ScheduleWindow = {
  weekday: number;
  startMinutes: number;
  endMinutes: number;
};

export type TimeOffWindow = {
  startsAt: Date;
  endsAt: Date;
  reason: string | null;
};

/** Tudo que decide se o profissional atende num instante — lido de uma vez. */
export type ProfessionalAvailability = {
  schedules: ScheduleWindow[];
  timeOff: TimeOffWindow[];
};

/** 480 -> "08:00". Mesmo formato que a recepção vê na tela. */
function formatMinutes(minutesFromMidnight: number): string {
  const hours = Math.floor(minutesFromMidnight / 60);
  const minutes = minutesFromMidnight % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * Disponibilidade **do profissional**, camada acima do expediente da clínica
 * (`BusinessHoursService`). São coisas diferentes: a clínica abre 08–18, mas
 * o Dr. Paulo pode atender só de manhã às segundas.
 *
 * Duas regras:
 * - **Grade semanal** (`ProfessionalSchedule`) — recorrente. Sem nenhuma
 *   linha, o profissional herda o expediente da clínica; é o que evita
 *   travar quem já estava cadastrado antes desta feature existir.
 * - **Bloqueio** (`ProfessionalTimeOff`) — pontual, e sempre vence a grade.
 */
@Injectable()
export class ProfessionalAvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Carrega grade e bloqueios de uma vez. `get-availability` chama isto uma
   * única vez e reusa para os ~40 slots do dia, em vez de ir ao banco por slot.
   */
  async load(
    professionalId: string,
    tenantId: string,
    window: { from: Date; to: Date },
  ): Promise<ProfessionalAvailability> {
    const [schedules, timeOff] = await Promise.all([
      this.prisma.professionalSchedule.findMany({
        where: { professionalId, tenantId },
        select: { weekday: true, startMinutes: true, endMinutes: true },
      }),
      this.prisma.professionalTimeOff.findMany({
        // Qualquer bloqueio que cruze a janela consultada — inclusive férias
        // que começaram semana passada e terminam semana que vem.
        where: {
          professionalId,
          tenantId,
          startsAt: { lt: window.to },
          endsAt: { gt: window.from },
        },
        select: { startsAt: true, endsAt: true, reason: true },
      }),
    ]);

    return { schedules, timeOff };
  }

  /**
   * O atendimento cabe inteiro numa faixa da grade? Sem grade cadastrada,
   * qualquer horário serve (o expediente da clínica já foi validado antes).
   */
  fitsSchedule(
    availability: ProfessionalAvailability,
    startsAt: Date,
    endsAt: Date,
  ): boolean {
    if (availability.schedules.length === 0) return true;

    const weekday = startsAt.getDay();
    const start = minutesOfDay(startsAt);
    // Atendimento que vira o dia não cabe em faixa nenhuma — tratar como
    // fim "24h+" faz a comparação abaixo rejeitá-lo naturalmente.
    const end =
      minutesOfDay(endsAt) +
      (endsAt.getDate() !== startsAt.getDate() ? 24 * 60 : 0);

    return availability.schedules.some(
      (window) =>
        window.weekday === weekday &&
        start >= window.startMinutes &&
        end <= window.endMinutes,
    );
  }

  /** Sobrepõe algum bloqueio? Encostar não conta, igual à regra de conflito. */
  findTimeOff(
    availability: ProfessionalAvailability,
    startsAt: Date,
    endsAt: Date,
  ): TimeOffWindow | undefined {
    return availability.timeOff.find(
      (block) => startsAt < block.endsAt && endsAt > block.startsAt,
    );
  }

  /**
   * Recusa o agendamento quando o profissional não atende naquele horário.
   * Usado por criação e reagendamento — o `get-availability` usa os métodos
   * acima direto, porque lá o objetivo é filtrar, não lançar.
   */
  async assertAvailable(
    professionalId: string,
    tenantId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<void> {
    const availability = await this.load(professionalId, tenantId, {
      from: startsAt,
      to: endsAt,
    });

    const block = this.findTimeOff(availability, startsAt, endsAt);
    if (block) {
      throw new BadRequestException(
        block.reason
          ? `O profissional está indisponível neste período (${block.reason}).`
          : 'O profissional está indisponível neste período.',
      );
    }

    if (!this.fitsSchedule(availability, startsAt, endsAt)) {
      const weekday = startsAt.getDay();
      const windows = availability.schedules
        .filter((window) => window.weekday === weekday)
        .map(
          (window) =>
            `${formatMinutes(window.startMinutes)}–${formatMinutes(window.endMinutes)}`,
        );

      throw new BadRequestException(
        windows.length > 0
          ? `O profissional atende ${WEEKDAY_LABELS[weekday]} das ${windows.join(' e ')}.`
          : `O profissional não atende ${WEEKDAY_LABELS[weekday]}.`,
      );
    }
  }
}
