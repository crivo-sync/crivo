/**
 * Toda regra de expediente/disponibilidade raciocina no relógio de parede da
 * clínica, não no relógio do processo Node. `Date.getHours()`/`getDay()`
 * usam o fuso do SISTEMA OPERACIONAL — em dev (Mac, America/Sao_Paulo) isso
 * coincidia por acidente com o fuso da clínica; em produção (container
 * Railway, UTC por padrão) o mesmo código deslocaria o expediente em ~3h.
 *
 * Fixo em `America/Sao_Paulo`: o produto é Brasil-only hoje (preço em R$,
 * conteúdo PT-BR). Se um dia existir cliente fora desse fuso, isto vira um
 * campo `Tenant.timezone` — decisão de escopo consciente, não descuido.
 */
const CLINIC_TIME_ZONE = 'America/Sao_Paulo';

const WALL_CLOCK_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: CLINIC_TIME_ZONE,
  hour12: false,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

export type WallClockParts = {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number;
  second: number;
};

/** Partes do relógio de parede da clínica para um instante UTC qualquer. */
function wallClockParts(instant: Date): WallClockParts {
  const parts = Object.fromEntries(
    WALL_CLOCK_FORMATTER.formatToParts(instant).map((p) => [p.type, p.value]),
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    // `Intl` devolve "24" para meia-noite em vez de "00" com hour12: false.
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

/** Dia da semana (0=domingo..6=sábado) no fuso da clínica. */
export function clinicWeekday(instant: Date): number {
  // `Date.UTC` com as partes locais dá uma data cujo `getUTCDay()` é o
  // weekday correto, sem depender do fuso do processo.
  const { year, month, day } = wallClockParts(instant);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** Minutos desde a meia-noite (0–1439) no fuso da clínica. */
export function clinicMinutesOfDay(instant: Date): number {
  const { hour, minute } = wallClockParts(instant);
  return hour * 60 + minute;
}

/** Dia civil (`YYYY-MM-DD`) no fuso da clínica — chave para agrupar por dia. */
export function clinicDateKey(instant: Date): string {
  const { year, month, day } = wallClockParts(instant);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Offset de `America/Sao_Paulo` em relação a UTC, em minutos, no instante
 * dado (negativo — ex.: -180 para UTC-3). Calculado por ida-e-volta em vez
 * de fixo: sobrevive a qualquer mudança de regra de fuso do Brasil sem
 * precisar de deploy.
 */
function clinicOffsetMinutes(utcGuess: Date): number {
  const { year, month, day, hour, minute, second } = wallClockParts(utcGuess);
  const asIfUTC = Date.UTC(year, month - 1, day, hour, minute, second);
  return (asIfUTC - utcGuess.getTime()) / 60_000;
}

/**
 * Constrói o instante UTC correspondente a um horário de parede da clínica
 * (ano/mês/dia + minutos desde a meia-noite). Usado para montar os limites
 * do dia consultado (`dayStart`/`dayEnd`) e os slots oferecidos — o inverso
 * de `clinicMinutesOfDay`/`clinicDateKey`.
 */
export function fromClinicWallClock(
  dateKey: { year: number; month: number; day: number },
  minutesOfDay: number,
  secondsAndMs: { second?: number; ms?: number } = {},
): Date {
  const hour = Math.floor(minutesOfDay / 60);
  const minute = minutesOfDay % 60;
  const { second = 0, ms = 0 } = secondsAndMs;

  // Chute inicial: trata as partes como se já fossem UTC, mede o offset
  // real da clínica naquele instante aproximado, e corrige. Um único passo
  // basta porque o offset de um fuso não muda dentro da mesma janela de
  // poucas horas que separa o chute do instante real.
  const guess = new Date(
    Date.UTC(dateKey.year, dateKey.month - 1, dateKey.day, hour, minute, second, ms),
  );
  const offsetMinutes = clinicOffsetMinutes(guess);

  return new Date(guess.getTime() - offsetMinutes * 60_000);
}

/** Parseia "YYYY-MM-DD" como a meia-noite DAQUELE dia no fuso da clínica. */
export function parseClinicDateKey(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;

  const [, year, month, day] = match;
  return fromClinicWallClock(
    { year: Number(year), month: Number(month), day: Number(day) },
    0,
  );
}
