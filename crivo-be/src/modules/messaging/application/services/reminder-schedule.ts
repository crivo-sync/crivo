import type { RiskLevel } from 'src/modules/prediction/domain/no-show-risk';

/**
 * Quantas horas antes da consulta cada lembrete sai, por faixa de risco.
 *
 * É aqui que a predição deixa de ser um número numa tela e vira ação — o
 * diferencial declarado do produto. Um sistema que mostra "risco alto" e
 * manda o mesmo lembrete para todo mundo não fez nada com a previsão.
 *
 * Risco alto ganha **dois** lembretes: um cedo, que dá à clínica tempo de
 * reagir se o paciente não responder, e outro na véspera, que é quando a
 * falta de fato se decide. Risco baixo segue com um só — insistir com quem
 * sempre comparece gasta conversa paga e ensina o paciente a ignorar as
 * mensagens da clínica.
 */
export const REMINDER_HOURS_BY_RISK: Record<RiskLevel, number[]> = {
  HIGH: [72, 24],
  MEDIUM: [48],
  LOW: [24],
};

export type PlannedReminder = {
  hoursBefore: number;
  sendAt: Date;
  /** Milissegundos até o envio; `0` quando já passou da hora. */
  delay: number;
};

/**
 * Converte a faixa de risco em envios concretos.
 *
 * Descarta os horários que já passaram — marcar uma consulta para amanhã não
 * pode disparar o lembrete "de 72h atrás". O que sobra do lembrete imediato
 * já é coberto pelo aviso de "consulta marcada".
 *
 * `defaultHoursBefore` vem de `REMINDER_HOURS_BEFORE` e é o fallback quando
 * a faixa não tem cronograma próprio.
 */
export function planReminders(
  level: RiskLevel,
  startsAt: Date,
  defaultHoursBefore: number,
  now: Date = new Date(),
): PlannedReminder[] {
  const schedule = REMINDER_HOURS_BY_RISK[level] ?? [defaultHoursBefore];

  const planned = schedule
    .map((hoursBefore) => {
      const sendAt = new Date(startsAt.getTime() - hoursBefore * 3_600_000);
      return { hoursBefore, sendAt, delay: sendAt.getTime() - now.getTime() };
    })
    .filter((reminder) => reminder.delay > 0)
    .map((reminder) => ({ ...reminder, delay: Math.max(0, reminder.delay) }));

  // Consulta marcada em cima da hora não cai no vazio: manda um agora, senão
  // o paciente não receberia lembrete nenhum.
  if (planned.length === 0) {
    return [{ hoursBefore: 0, sendAt: now, delay: 0 }];
  }

  return planned;
}
