/** Limites de duração de um procedimento — espelham o CreateProcedureDto. */
export const MIN_DURATION_MINUTES = 5;
export const MAX_DURATION_MINUTES = 480;

/**
 * Duração escrita como as pessoas falam: "1 h 30 min" em vez de "90 min".
 * O backend continua trabalhando em minutos — isto é só apresentação, e vive
 * aqui porque a mesma duração aparece na tabela, no formulário, no
 * agendamento e no reagendamento.
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (!hours) return `${rest} min`;
  if (!rest) return `${hours} h`;
  return `${hours} h ${rest} min`;
}
