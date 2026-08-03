import dayjs, { type Dayjs } from "dayjs";

/**
 * Regra de negócio do horário comercial para agendamentos.
 * - Segunda a sábado: 09:00 às 19:00
 * - Domingo: fechado
 *
 * A janela usa hora de início inclusiva e hora de fim exclusiva (ex.: 19:00
 * não abre vaga para começar um atendimento às 19:00).
 */
export const BUSINESS_HOURS = {
  weekdays: { start: 9, end: 19 },
  saturday: { start: 9, end: 19 },
} as const;

export type BusinessHoursWindow = { start: number; end: number };

/** Janela de horário comercial para o dia, ou `null` se a clínica fecha. */
export function getBusinessHours(day: Dayjs): BusinessHoursWindow | null {
  const weekday = day.day();
  if (weekday === 0) return null; // domingo
  if (weekday === 6) return BUSINESS_HOURS.saturday; // sábado
  return BUSINESS_HOURS.weekdays;
}

/** Desabilita dias inteiros em que a clínica está fechada (domingo). */
export function shouldDisableDate(date: Dayjs): boolean {
  return getBusinessHours(date) === null;
}

/**
 * Desabilita horários fora da janela comercial no picker, garantindo que o
 * atendimento (início + duração) caiba inteiro dentro do horário de
 * funcionamento. Ex.: um procedimento de 120 min não pode começar 18:30.
 */
export function shouldDisableTime(
  value: Dayjs,
  view: "hours" | "minutes" | "seconds",
  durationMinutes = 0,
): boolean {
  const window = getBusinessHours(value);
  if (!window) return true;

  const hourStart = value.hour() * 60;
  if (hourStart < window.start * 60 || hourStart >= window.end * 60) {
    return true; // hora fora da janela comercial
  }

  if (view === "hours") {
    // Se nem no minuto 0 a duração cabe, a hora inteira fica desabilitada.
    return durationMinutes > 0 && hourStart + durationMinutes > window.end * 60;
  }

  // Minutos/segundos: desabilita quando o início + duração ultrapassa o fim.
  const totalMinutes = hourStart + value.minute();
  return (
    durationMinutes > 0 && totalMinutes + durationMinutes > window.end * 60
  );
}

/** Verifica se um instante (hora local) está dentro do horário comercial. */
export function isWithinBusinessHours(value: Dayjs): boolean {
  const window = getBusinessHours(value);
  if (!window) return false;
  const totalMinutes = value.hour() * 60 + value.minute();
  return totalMinutes >= window.start * 60 && totalMinutes < window.end * 60;
}

/**
 * Valida um `startsAt` (ISO) para criação/reagendamento.
 * Retorna a mensagem de erro, ou `null` se o horário é aceito.
 */
export function validateAppointmentStart(
  iso: string,
  durationMinutes = 0,
): string | null {
  const value = dayjs(iso);
  if (!value.isValid()) return "Informe data e hora";
  if (value.isBefore(dayjs().startOf("minute"))) {
    return "Não é possível agendar em um horário no passado";
  }

  const window = getBusinessHours(value);
  if (!window || !isWithinBusinessHours(value)) {
    return "Horário fora do horário comercial (seg–sáb, 09h às 19h)";
  }

  const totalMinutes = value.hour() * 60 + value.minute();
  if (durationMinutes > 0 && totalMinutes + durationMinutes > window.end * 60) {
    return `O atendimento precisa terminar até as ${window.end}h`;
  }
  return null;
}
