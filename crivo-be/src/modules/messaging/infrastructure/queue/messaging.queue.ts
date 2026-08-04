export const MESSAGING_QUEUE = 'messaging';

export type SendMessageJob = {
  messageId: string;
};

/**
 * Só observabilidade: é o que aparece em `returnValue` no Bull Board.
 * Nenhum código consome — serve para o painel dizer o que aconteceu com o
 * job em vez de mostrar `null`.
 */
export type SendMessageJobResult =
  | {
      outcome: 'sent';
      provider: string;
      toPhone: string;
      type: string;
      providerMessageId: string | null;
    }
  | { outcome: 'skipped'; reason: string };

/**
 * Tentativas espaçadas exponencialmente. Se todas falharem, a mensagem vira
 * FAILED e aparece na lista de "ligar para estes pacientes" — o ponto central
 * do produto é que falha de envio nunca passa despercebida.
 */
/**
 * Base do backoff exponencial: a espera é `2^(tentativa-1) × este valor`
 * (30s → 60s → 120s). Exportado porque o worker recalcula o mesmo número
 * para dizer no log quando será a próxima tentativa — se ficasse só dentro
 * de `SEND_JOB_OPTIONS`, os dois sairiam do lugar em silêncio.
 */
export const BACKOFF_BASE_MS = 30_000;

export const SEND_JOB_OPTIONS = {
  attempts: 4,
  backoff: { type: 'exponential' as const, delay: BACKOFF_BASE_MS },
  removeOnComplete: 1_000,
  removeOnFail: false,
};
