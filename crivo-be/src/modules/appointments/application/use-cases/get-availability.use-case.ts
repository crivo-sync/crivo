import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import {
  clinicWeekday,
  clinicDateKey,
  fromClinicWallClock,
} from 'src/shared/clinic-time';
import {
  APPOINTMENT_REPOSITORY,
  type AppointmentRepository,
} from '../../domain/repository/appointment.repository';
import { BusinessHoursService } from '../services/business-hours.service';
import { ProfessionalAvailabilityService } from '../services/professional-availability.service';

export type GetAvailabilityInput = {
  tenantId: string;
  professionalId: string;
  procedureId: string;
  /** Dia consultado (a hora é ignorada). */
  date: Date;
  /** Ignora o próprio agendamento — usado ao reagendar. */
  excludeAppointmentId?: string;
};

/**
 * De quanto em quanto tempo um atendimento pode começar. 15min é o menor
 * passo que a recepção usa na prática; a duração real continua vindo do
 * procedimento, isto é só a granularidade das opções oferecidas.
 */
const SLOT_STEP_MINUTES = 15;

/** Teto de segurança: nenhum profissional tem tanto agendamento num dia. */
const MAX_APPOINTMENTS_IN_DAY = 200;

/**
 * Por que o dia não tem horário livre. Sem isso a recepção só vê
 * "nada disponível" e conclui que há bug — na prática a causa é quase sempre
 * a grade do profissional ou o dia já ter passado.
 */
export type NoSlotsReason =
  /** Um bloqueio (férias, congresso) cobre o dia. */
  | 'TIME_OFF'
  /** O profissional tem grade, mas não atende neste dia da semana. */
  | 'NOT_WORKING_DAY'
  /** Havia janela, mas o último início possível já passou. */
  | 'WINDOW_PASSED'
  /** Havia janela e ainda há tempo, mas todos os horários estão ocupados. */
  | 'ALL_BUSY';

@Injectable()
export class GetAvailabilityUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: AppointmentRepository,
    private readonly prisma: PrismaService,
    private readonly businessHours: BusinessHoursService,
    private readonly professionalAvailability: ProfessionalAvailabilityService,
  ) {}

  async execute(input: GetAvailabilityInput) {
    // As três leituras são independentes — em série custariam round-trips
    // extras num endpoint que a recepção chama a cada troca de dia.
    const [procedure, professional, config] = await Promise.all([
      this.prisma.procedure.findFirst({
        where: {
          id: input.procedureId,
          tenantId: input.tenantId,
          deletedAt: null,
          isActive: true,
        },
        select: { durationMinutes: true },
      }),
      this.prisma.professional.findFirst({
        where: {
          id: input.professionalId,
          tenantId: input.tenantId,
          deletedAt: null,
          isActive: true,
        },
        select: { procedures: { select: { id: true } } },
      }),
      this.businessHours.getConfig(input.tenantId),
    ]);

    if (!procedure) {
      throw new NotFoundException('Procedimento não encontrado ou inativo.');
    }

    if (!professional) {
      throw new NotFoundException('Profissional não encontrado ou inativo.');
    }

    if (!config) {
      throw new NotFoundException('Clínica não encontrada.');
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

    // `input.date` já chega como meia-noite do dia consultado no fuso da
    // clínica (DTO usa `parseClinicDateKey`) — extrai o ano/mês/dia local
    // dele para reconstruir os limites do dia sem depender do fuso do
    // processo Node.
    const dateKey = clinicDateKey(input.date);
    const [dateYear, dateMonth, dateDay] = dateKey.split('-').map(Number);
    const dayStart = fromClinicWallClock(
      { year: dateYear, month: dateMonth, day: dateDay },
      0,
    );

    // Dia fechado: devolve lista vazia com o motivo, em vez de 400 — quem
    // chama está perguntando "o que tem livre?", e "nada, é domingo" é uma
    // resposta válida para renderizar na tela.
    if (!config.businessDays.includes(clinicWeekday(dayStart))) {
      return {
        date: dayStart,
        durationMinutes: procedure.durationMinutes,
        slots: [],
        closed: true,
      };
    }

    const dayEnd = fromClinicWallClock(
      { year: dateYear, month: dateMonth, day: dateDay },
      23 * 60 + 59,
      { second: 59, ms: 999 },
    );

    const [{ data: appointments }, availability] = await Promise.all([
      this.appointmentRepository.findMany({
        tenantId: input.tenantId,
        professionalId: input.professionalId,
        from: dayStart,
        to: dayEnd,
        page: 1,
        perPage: MAX_APPOINTMENTS_IN_DAY,
      }),
      // Carregado uma vez e reusado nos ~40 slots do laço abaixo — consultar
      // por slot seria dezenas de idas ao banco por troca de dia na tela.
      this.professionalAvailability.load(input.professionalId, input.tenantId, {
        from: dayStart,
        to: dayEnd,
      }),
    ]);

    // CANCELLED/NO_SHOW não ocupam a agenda — mesma regra do `findOverlapping`.
    const busy = appointments
      .filter((appointment) =>
        ['SCHEDULED', 'CONFIRMED', 'COMPLETED'].includes(appointment.status),
      )
      .filter((appointment) => appointment.id !== input.excludeAppointmentId)
      .map((appointment) => ({
        start: appointment.startsAt.getTime(),
        end: appointment.endsAt.getTime(),
      }));

    const now = Date.now();
    const slots: { startsAt: Date; endsAt: Date }[] = [];

    for (
      let minutes = config.businessHoursStart;
      // O atendimento inteiro precisa caber antes do fechamento — mesma regra
      // do `assertWithinBusinessHours`, aplicada aqui para nem oferecer o
      // horário que seria recusado no submit.
      minutes + procedure.durationMinutes <= config.businessHoursEnd;
      minutes += SLOT_STEP_MINUTES
    ) {
      const start = fromClinicWallClock(
        { year: dateYear, month: dateMonth, day: dateDay },
        minutes,
      );
      const end = new Date(
        start.getTime() + procedure.durationMinutes * 60_000,
      );

      if (start.getTime() < now) continue; // horário que já passou

      const overlaps = busy.some(
        (slot) => start.getTime() < slot.end && end.getTime() > slot.start,
      );
      if (overlaps) continue;

      // Fora da grade do profissional (ex.: só atende de manhã) ou dentro de
      // um bloqueio (férias, congresso). Filtrar aqui é o que impede oferecer
      // um horário que o `assertAvailable` recusaria no submit.
      if (!this.professionalAvailability.fitsSchedule(availability, start, end))
        continue;

      if (this.professionalAvailability.findTimeOff(availability, start, end))
        continue;

      slots.push({ startsAt: start, endsAt: end });
    }

    // Quando não sobra nada, a recepção merece saber o motivo — "não tem
    // horário" sem explicação é lido como bug (e não é: é a grade da Dra.
    // Helena atendendo só de manhã, o dia já ter passado etc.).
    const weekday = clinicWeekday(dayStart);
    const dayWindows = availability.schedules.filter(
      (window) => window.weekday === weekday,
    );
    const dayTimeOff = availability.timeOff.find(
      (block) => dayStart < block.endsAt && dayEnd > block.startsAt,
    );

    let noSlotsReason: NoSlotsReason | undefined;
    if (slots.length === 0) {
      if (dayTimeOff) {
        noSlotsReason = 'TIME_OFF';
      } else if (availability.schedules.length > 0 && dayWindows.length === 0) {
        noSlotsReason = 'NOT_WORKING_DAY';
      } else {
        // Sem grade o profissional herda o expediente da clínica; com grade,
        // o último início possível é o fim da janela menos a duração.
        const lastStartMinutes =
          dayWindows.length > 0
            ? Math.max(
                ...dayWindows.map(
                  (window) => window.endMinutes - procedure.durationMinutes,
                ),
              )
            : config.businessHoursEnd - procedure.durationMinutes;

        // Último início em tempo absoluto: se já passou, o dia acabou para
        // este profissional (hoje à tarde com janela só de manhã, ou um dia
        // passado inteiro). Se ainda não passou, sobrava tempo e o vazio é
        // agenda cheia.
        const lastStart = fromClinicWallClock(
          { year: dateYear, month: dateMonth, day: dateDay },
          lastStartMinutes,
        );

        noSlotsReason =
          lastStart.getTime() <= now ? 'WINDOW_PASSED' : 'ALL_BUSY';
      }
    }

    return {
      date: dayStart,
      durationMinutes: procedure.durationMinutes,
      slots,
      closed: false,
      noSlotsReason,
      // Grade do profissional para o dia consultado — o cliente formata
      // "atende quarta das 08:00 às 12:00" sem precisar de outra chamada.
      scheduleWindows: dayWindows.map((window) => ({
        startMinutes: window.startMinutes,
        endMinutes: window.endMinutes,
      })),
      timeOff: dayTimeOff
        ? {
            startsAt: dayTimeOff.startsAt,
            endsAt: dayTimeOff.endsAt,
            reason: dayTimeOff.reason,
          }
        : null,
    };
  }
}
