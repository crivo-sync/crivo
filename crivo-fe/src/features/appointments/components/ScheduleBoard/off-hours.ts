import type { SchedulerEvent } from "@mui/x-scheduler/models";

import type { Professional, TimeOff } from "@/features/professionals/types";

/**
 * Fuso da clínica. O sistema inteiro assume horário de Brasília: expediente e
 * grade são guardados como "minutos desde a meia-noite" sem fuso, e só fazem
 * sentido nele. Fica aqui como constante única para não divergir do
 * `displayTimezone` do calendário.
 */
export const CLINIC_TIMEZONE = "America/Sao_Paulo";

/** Intervalo em minutos desde a meia-noite. */
type Interval = { start: number; end: number };

const MINUTES_IN_DAY = 24 * 60;

export type ClinicHours = {
  businessDays: number[];
  businessHoursStart: number;
  businessHoursEnd: number;
};

function intersect(a: Interval, b: Interval): Interval | null {
  const start = Math.max(a.start, b.start);
  const end = Math.min(a.end, b.end);
  return start < end ? { start, end } : null;
}

/** Remove de `base` tudo que estiver coberto por `cuts`. */
function subtract(base: Interval[], cuts: Interval[]): Interval[] {
  return cuts.reduce<Interval[]>((windows, cut) => {
    return windows.flatMap((window) => {
      if (cut.end <= window.start || cut.start >= window.end) return [window];

      const remaining: Interval[] = [];
      if (cut.start > window.start)
        remaining.push({ start: window.start, end: cut.start });
      if (cut.end < window.end)
        remaining.push({ start: cut.end, end: window.end });
      return remaining;
    });
  }, base);
}

/** O que sobra de `within` depois de tirar `windows`. */
function complement(windows: Interval[], within: Interval): Interval[] {
  return subtract([within], windows);
}

/** Minutos desde a meia-noite daquele dia, recortado ao próprio dia. */
function timeOffToInterval(block: TimeOff, day: Date): Interval | null {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);

  const startsAt = new Date(block.startsAt);
  const endsAt = new Date(block.endsAt);

  const toMinutes = (date: Date) =>
    Math.round((date.getTime() - dayStart.getTime()) / 60_000);

  const interval = {
    start: Math.max(0, toMinutes(startsAt)),
    end: Math.min(MINUTES_IN_DAY, toMinutes(endsAt)),
  };

  return interval.start < interval.end ? interval : null;
}

function isoWallTime(day: Date, minutes: number): string {
  const date = new Date(day);
  date.setHours(0, 0, 0, 0);

  const pad = (value: number) => String(value).padStart(2, "0");
  const clamped = Math.min(minutes, MINUTES_IN_DAY - 1);

  // Sem "Z": o scheduler interpreta como hora de parede no `timezone` do
  // evento. Montar a string na mão evita converter para UTC e voltar, que é
  // onde um horário de clínica costuma escorregar uma hora.
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(Math.floor(clamped / 60))}:${pad(clamped % 60)}:00`
  );
}

export type OffHoursInput = {
  professional: Professional;
  timeOff: TimeOff[];
  /** Dias visíveis no calendário. */
  days: Date[];
  clinic: ClinicHours;
  /** Faixa de horas desenhada na grade (`viewConfig`). */
  gridStartHour: number;
  gridEndHour: number;
};

/**
 * Blocos "não atende" para as horas em que o profissional **não** pode
 * receber paciente, dentro da faixa desenhada na grade.
 *
 * Existe porque espaço vazio no Quadro é lido como horário livre — foi
 * exatamente assim que uma quarta à tarde pareceu disponível quando a Dra.
 * Helena só atende 08:00–12:00 nesse dia.
 *
 * A conta é a mesma do `get-availability` do backend: expediente da clínica
 * ∩ grade do profissional − bloqueios. Se divergir, o Quadro volta a
 * prometer horário que o formulário recusa.
 */
export function buildOffHoursEvents({
  professional,
  timeOff,
  days,
  clinic,
  gridStartHour,
  gridEndHour,
}: OffHoursInput): SchedulerEvent[] {
  const grid: Interval = {
    start: gridStartHour * 60,
    end: gridEndHour * 60,
  };
  const clinicWindow: Interval = {
    start: clinic.businessHoursStart,
    end: clinic.businessHoursEnd,
  };
  const schedules = professional.schedules ?? [];

  return days.flatMap((day) => {
    const weekday = day.getDay();

    const blocked: Interval[] = clinic.businessDays.includes(weekday)
      ? (() => {
          // Grade vazia = herda o expediente inteiro da clínica, mesma regra
          // do backend (`fitsSchedule` devolve true sem grade cadastrada).
          const ownWindows =
            schedules.length === 0
              ? [clinicWindow]
              : schedules
                  .filter((window) => window.weekday === weekday)
                  .map((window) => ({
                    start: window.startMinutes,
                    end: window.endMinutes,
                  }));

          const working = ownWindows
            .map((window) => intersect(window, clinicWindow))
            .filter((window): window is Interval => window !== null);

          const cuts = timeOff
            .map((block) => timeOffToInterval(block, day))
            .filter((interval): interval is Interval => interval !== null);

          return complement(subtract(working, cuts), grid);
        })()
      : [grid]; // clínica fechada: o dia inteiro é indisponível

    return blocked
      .map((interval) => intersect(interval, grid))
      .filter((interval): interval is Interval => interval !== null)
      .map((interval) => ({
        id: `off-${professional.id}-${isoWallTime(day, interval.start)}`,
        title: "Não atende",
        start: isoWallTime(day, interval.start),
        end: isoWallTime(day, interval.end),
        timezone: CLINIC_TIMEZONE,
        color: "grey" as const,
        readOnly: true,
      }));
  });
}
