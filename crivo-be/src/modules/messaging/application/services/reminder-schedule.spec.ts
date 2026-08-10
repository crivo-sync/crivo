import { planReminders } from './reminder-schedule';

const NOW = new Date('2026-08-10T12:00:00Z');
const hoursFromNow = (hours: number) =>
  new Date(NOW.getTime() + hours * 3_600_000);

describe('planReminders', () => {
  it('risco alto recebe dois lembretes: cedo e na véspera', () => {
    // O cedo dá à clínica tempo de reagir ao silêncio; o da véspera pega o
    // momento em que a falta se decide.
    const plan = planReminders('HIGH', hoursFromNow(24 * 7), 24, NOW);

    expect(plan.map((r) => r.hoursBefore)).toEqual([72, 24]);
  });

  it('risco médio recebe um lembrete, mais cedo que o padrão', () => {
    const plan = planReminders('MEDIUM', hoursFromNow(24 * 7), 24, NOW);

    expect(plan.map((r) => r.hoursBefore)).toEqual([48]);
  });

  it('risco baixo mantém o lembrete único da véspera', () => {
    // Insistir com quem sempre comparece gasta conversa paga e ensina o
    // paciente a ignorar as mensagens.
    const plan = planReminders('LOW', hoursFromNow(24 * 7), 24, NOW);

    expect(plan.map((r) => r.hoursBefore)).toEqual([24]);
  });

  it('descarta lembrete cujo horário já passou', () => {
    // Consulta em 30h: o lembrete de 72h atrás não existe mais.
    const plan = planReminders('HIGH', hoursFromNow(30), 24, NOW);

    expect(plan.map((r) => r.hoursBefore)).toEqual([24]);
  });

  it('manda um agora quando a consulta é em cima da hora', () => {
    // Sem isso o paciente de uma consulta marcada para daqui a 2h não
    // receberia lembrete nenhum.
    const plan = planReminders('HIGH', hoursFromNow(2), 24, NOW);

    expect(plan).toHaveLength(1);
    expect(plan[0].delay).toBe(0);
  });

  it('calcula o horário de envio a partir da consulta', () => {
    const startsAt = hoursFromNow(24 * 7);
    const plan = planReminders('LOW', startsAt, 24, NOW);

    expect(plan[0].sendAt).toEqual(
      new Date(startsAt.getTime() - 24 * 3_600_000),
    );
  });

  it('o delay é a distância até o envio, não até a consulta', () => {
    const plan = planReminders('LOW', hoursFromNow(48), 24, NOW);

    // Consulta em 48h, lembrete 24h antes → envio daqui a 24h.
    expect(plan[0].delay).toBe(24 * 3_600_000);
  });
});
