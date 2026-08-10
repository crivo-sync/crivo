/**
 * Risco de o paciente faltar, por regra determinística.
 *
 * **Não é modelo estatístico, e isso é decisão, não limitação.** Com 4
 * `NO_SHOW` no banco não há como treinar nada — um modelo aqui aprenderia o
 * padrão do seed, não o do paciente. A regra entrega valor desde o primeiro
 * dia e vai produzindo o histórico rotulado que um modelo precisaria depois.
 *
 * Os pesos são hipótese explícita, não resultado de ajuste: ninguém mediu
 * ainda quanto cada fator pesa nesta clínica. Ficam aqui, num lugar só, para
 * serem corrigidos quando houver dado real — ver `RISK_FACTORS`.
 */

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type RiskInput = {
  /** Faltas anteriores do paciente (`NO_SHOW`). */
  previousNoShows: number;
  /** Atendimentos que ele de fato compareceu (`COMPLETED`). */
  previousCompleted: number;
  /** Já respondeu ao lembrete deste agendamento? */
  hasConfirmed: boolean;
  /** Primeira consulta do paciente na clínica. */
  isFirstVisit: boolean;
  /** Hora de início (0–23), no relógio da clínica. */
  hourOfDay: number;
  /** Dias entre a marcação e a consulta. */
  daysUntilAppointment: number;
};

export type RiskFactor = {
  code: string;
  /** Texto que a recepção lê. */
  label: string;
  points: number;
};

export type RiskAssessment = {
  score: number;
  level: RiskLevel;
  /** Por que este risco — é o que torna a decisão auditável. */
  factors: RiskFactor[];
};

/**
 * Faixas de corte. `HIGH` a partir de 50 porque é o ponto em que dois sinais
 * fortes se somam (ex.: já faltou + não confirmou) — abaixo disso um sinal
 * isolado não justifica tratar o paciente como provável falta.
 */
const HIGH_THRESHOLD = 50;
const MEDIUM_THRESHOLD = 25;

/**
 * Peso de cada fator. Documentado com o raciocínio para poder ser
 * contestado: a literatura de no-show é consistente em apontar histórico de
 * falta como o preditor mais forte, e é isso que o peso reflete.
 */
export const RISK_FACTORS = {
  /** Sinal mais forte: quem faltou tende a faltar de novo. */
  REPEAT_NO_SHOW: 35,
  /** Cada falta além da primeira agrava, mas com retorno decrescente. */
  ADDITIONAL_NO_SHOW: 10,
  /** Silêncio ao lembrete é o sinal mais acionável que a clínica tem. */
  NOT_CONFIRMED: 25,
  /** Sem histórico, não há vínculo — nem para prever, nem para segurar. */
  FIRST_VISIT: 15,
  /** Primeiro horário: trânsito, sono, imprevisto de manhã. */
  EARLY_MORNING: 10,
  /** Marcado com muita antecedência: mais tempo para esquecer ou mudar de ideia. */
  BOOKED_LONG_AHEAD: 10,
  /** Histórico bom compensa: quem sempre veio é aposta melhor. */
  RELIABLE_HISTORY: -20,
} as const;

/** Antes disso, "cedo" é relativo — 8h é o começo típico do expediente. */
const EARLY_MORNING_UNTIL = 8;
const LONG_AHEAD_DAYS = 30;
const RELIABLE_MIN_VISITS = 3;

export function assessNoShowRisk(input: RiskInput): RiskAssessment {
  const factors: RiskFactor[] = [];

  if (input.previousNoShows > 0) {
    factors.push({
      code: 'REPEAT_NO_SHOW',
      label:
        input.previousNoShows === 1
          ? 'Já faltou uma vez'
          : `Já faltou ${input.previousNoShows} vezes`,
      points:
        RISK_FACTORS.REPEAT_NO_SHOW +
        (input.previousNoShows - 1) * RISK_FACTORS.ADDITIONAL_NO_SHOW,
    });
  }

  if (!input.hasConfirmed) {
    factors.push({
      code: 'NOT_CONFIRMED',
      label: 'Ainda não confirmou presença',
      points: RISK_FACTORS.NOT_CONFIRMED,
    });
  }

  if (input.isFirstVisit) {
    factors.push({
      code: 'FIRST_VISIT',
      label: 'Primeira consulta na clínica',
      points: RISK_FACTORS.FIRST_VISIT,
    });
  }

  if (input.hourOfDay <= EARLY_MORNING_UNTIL) {
    factors.push({
      code: 'EARLY_MORNING',
      label: 'Primeiro horário da manhã',
      points: RISK_FACTORS.EARLY_MORNING,
    });
  }

  if (input.daysUntilAppointment >= LONG_AHEAD_DAYS) {
    factors.push({
      code: 'BOOKED_LONG_AHEAD',
      label: 'Marcado com mais de um mês de antecedência',
      points: RISK_FACTORS.BOOKED_LONG_AHEAD,
    });
  }

  // Só conta como histórico confiável quem tem presença repetida E nenhuma
  // falta — uma única falta já descaracteriza a previsibilidade.
  if (
    input.previousCompleted >= RELIABLE_MIN_VISITS &&
    input.previousNoShows === 0
  ) {
    factors.push({
      code: 'RELIABLE_HISTORY',
      label: `Compareceu às últimas ${input.previousCompleted} consultas`,
      points: RISK_FACTORS.RELIABLE_HISTORY,
    });
  }

  // Trava em 0–100: o desconto do histórico bom não pode gerar score
  // negativo, e a soma de fatores não pode passar de 100 — os dois
  // quebrariam a leitura de "score é uma porcentagem de risco".
  const raw = factors.reduce((sum, factor) => sum + factor.points, 0);
  const score = Math.max(0, Math.min(100, raw));

  return { score, level: toLevel(score), factors };
}

function toLevel(score: number): RiskLevel {
  if (score >= HIGH_THRESHOLD) return 'HIGH';
  if (score >= MEDIUM_THRESHOLD) return 'MEDIUM';
  return 'LOW';
}
