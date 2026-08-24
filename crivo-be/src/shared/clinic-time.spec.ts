import {
  clinicWeekday,
  clinicMinutesOfDay,
  clinicDateKey,
  fromClinicWallClock,
  parseClinicDateKey,
} from './clinic-time';

describe('clinic-time (fuso fixo America/Sao_Paulo, UTC-3)', () => {
  it('clinicMinutesOfDay converte instante UTC para minutos do dia local', () => {
    // 13:00 UTC == 10:00 em São Paulo == 600 minutos
    expect(clinicMinutesOfDay(new Date('2026-08-24T13:00:00.000Z'))).toBe(
      600,
    );
    // meia-noite local == 03:00 UTC
    expect(clinicMinutesOfDay(new Date('2026-08-24T03:00:00.000Z'))).toBe(0);
  });

  it('clinicWeekday usa o dia da semana local, não o UTC', () => {
    // 2026-08-24 00:30 UTC (segunda de madrugada em UTC) é ainda
    // 2026-08-23 21:30 em São Paulo == domingo
    const instant = new Date('2026-08-24T00:30:00.000Z');
    expect(clinicWeekday(instant)).toBe(0); // domingo
  });

  it('clinicDateKey agrupa pelo dia civil local, não o dia UTC', () => {
    // mesma meia-noite de madrugada em UTC que ainda é o dia anterior em BR
    expect(clinicDateKey(new Date('2026-08-24T00:30:00.000Z'))).toBe(
      '2026-08-23',
    );
    expect(clinicDateKey(new Date('2026-08-24T13:00:00.000Z'))).toBe(
      '2026-08-24',
    );
  });

  it('fromClinicWallClock é o inverso de clinicMinutesOfDay/clinicDateKey', () => {
    const instant = fromClinicWallClock(
      { year: 2026, month: 8, day: 24 },
      10 * 60, // 10:00
    );

    expect(instant.toISOString()).toBe('2026-08-24T13:00:00.000Z');
    expect(clinicDateKey(instant)).toBe('2026-08-24');
    expect(clinicMinutesOfDay(instant)).toBe(600);
  });

  it('parseClinicDateKey monta a meia-noite local, não a meia-noite UTC', () => {
    const parsed = parseClinicDateKey('2026-08-10');
    expect(parsed).toBeDefined();
    // meia-noite em São Paulo == 03:00 UTC do mesmo dia
    expect(parsed!.toISOString()).toBe('2026-08-10T03:00:00.000Z');
  });

  it('parseClinicDateKey rejeita formato inválido', () => {
    expect(parseClinicDateKey('10/08/2026')).toBeUndefined();
    expect(parseClinicDateKey('not-a-date')).toBeUndefined();
  });

  it('vira o ano corretamente (31/12 -> 01/01)', () => {
    const instant = fromClinicWallClock(
      { year: 2026, month: 12, day: 31 },
      23 * 60 + 30,
    );
    expect(clinicDateKey(instant)).toBe('2026-12-31');

    const nextDay = new Date(instant.getTime() + 60 * 60_000);
    expect(clinicDateKey(nextDay)).toBe('2027-01-01');
    expect(clinicWeekday(nextDay)).toBe(clinicWeekday(nextDay)); // sanity
  });
});
