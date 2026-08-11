import { assessNoShowRisk, type RiskInput } from './no-show-risk';

/** Paciente sem nenhum sinal de risco: já veio antes, confirmou, horário comum. */
const BASE: RiskInput = {
  previousNoShows: 0,
  previousCompleted: 1,
  hasConfirmed: true,
  isFirstVisit: false,
  hourOfDay: 14,
  daysUntilAppointment: 3,
};

const codes = (input: RiskInput) =>
  assessNoShowRisk(input).factors.map((f) => f.code);

describe('assessNoShowRisk', () => {
  it('não acusa risco quando não há sinal nenhum', () => {
    const result = assessNoShowRisk(BASE);

    expect(result.score).toBe(0);
    expect(result.level).toBe('LOW');
    expect(result.factors).toEqual([]);
  });

  describe('histórico de falta', () => {
    it('é o fator de maior peso', () => {
      const result = assessNoShowRisk({ ...BASE, previousNoShows: 1 });

      expect(result.score).toBe(35);
      expect(result.level).toBe('MEDIUM');
    });

    it('agrava a cada falta adicional', () => {
      expect(assessNoShowRisk({ ...BASE, previousNoShows: 2 }).score).toBe(45);
      expect(assessNoShowRisk({ ...BASE, previousNoShows: 3 }).score).toBe(55);
    });

    it('sozinho, duas faltas já classificam como alto', () => {
      expect(assessNoShowRisk({ ...BASE, previousNoShows: 3 }).level).toBe(
        'HIGH',
      );
    });
  });

  describe('confirmação', () => {
    it('não confirmar soma risco', () => {
      const result = assessNoShowRisk({ ...BASE, hasConfirmed: false });

      expect(result.score).toBe(25);
      expect(codes({ ...BASE, hasConfirmed: false })).toContain(
        'NOT_CONFIRMED',
      );
    });

    it('confirmar não gera fator nenhum', () => {
      expect(codes({ ...BASE, hasConfirmed: true })).not.toContain(
        'NOT_CONFIRMED',
      );
    });
  });

  it('soma dois sinais fortes e chega a alto', () => {
    // É o corte que a faixa HIGH existe para pegar: já faltou + silêncio.
    const result = assessNoShowRisk({
      ...BASE,
      previousNoShows: 1,
      hasConfirmed: false,
    });

    expect(result.score).toBe(60);
    expect(result.level).toBe('HIGH');
  });

  describe('histórico confiável desconta', () => {
    it('reduz o risco de quem sempre compareceu', () => {
      const semHistorico = assessNoShowRisk({
        ...BASE,
        hasConfirmed: false,
        previousCompleted: 1,
      });
      const comHistorico = assessNoShowRisk({
        ...BASE,
        hasConfirmed: false,
        previousCompleted: 5,
      });

      expect(comHistorico.score).toBeLessThan(semHistorico.score);
      expect(
        codes({ ...BASE, hasConfirmed: false, previousCompleted: 5 }),
      ).toContain('RELIABLE_HISTORY');
    });

    it('uma falta anterior já cancela o desconto', () => {
      // Presença repetida não vale como previsibilidade se ele já furou.
      expect(
        codes({ ...BASE, previousCompleted: 5, previousNoShows: 1 }),
      ).not.toContain('RELIABLE_HISTORY');
    });

    it('nunca produz score negativo', () => {
      const result = assessNoShowRisk({ ...BASE, previousCompleted: 10 });

      expect(result.score).toBe(0);
      expect(result.level).toBe('LOW');
    });
  });

  describe('contexto do agendamento', () => {
    it('primeiro horário da manhã pesa', () => {
      expect(codes({ ...BASE, hourOfDay: 8 })).toContain('EARLY_MORNING');
      expect(codes({ ...BASE, hourOfDay: 9 })).not.toContain('EARLY_MORNING');
    });

    it('marcação muito antecipada pesa', () => {
      expect(codes({ ...BASE, daysUntilAppointment: 45 })).toContain(
        'BOOKED_LONG_AHEAD',
      );
      expect(codes({ ...BASE, daysUntilAppointment: 7 })).not.toContain(
        'BOOKED_LONG_AHEAD',
      );
    });

    it('primeira consulta pesa', () => {
      expect(codes({ ...BASE, isFirstVisit: true })).toContain('FIRST_VISIT');
    });
  });

  it('trava o score em 100 mesmo com todos os fatores', () => {
    const result = assessNoShowRisk({
      previousNoShows: 6,
      previousCompleted: 0,
      hasConfirmed: false,
      isFirstVisit: true,
      hourOfDay: 7,
      daysUntilAppointment: 60,
    });

    expect(result.score).toBe(100);
    expect(result.level).toBe('HIGH');
  });

  it('explica o motivo de cada ponto', () => {
    // O `factors` é o que torna a decisão auditável: sem ele a recepção veria
    // "risco alto" sem saber o porquê, e não teria como discordar.
    const result = assessNoShowRisk({
      ...BASE,
      previousNoShows: 1,
      hasConfirmed: false,
    });

    expect(result.factors).toHaveLength(2);
    expect(result.factors[0].label).toBe('Já faltou uma vez');
    expect(result.factors[1].label).toBe('Ainda não confirmou presença');
  });
});
