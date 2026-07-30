export const MESSAGING_QUEUE = 'messaging';

export type SendMessageJob = {
  messageId: string;
};

/**
 * Tentativas espaçadas exponencialmente. Se todas falharem, a mensagem vira
 * FAILED e aparece na lista de "ligar para estes pacientes" — o ponto central
 * do produto é que falha de envio nunca passa despercebida.
 */
export const SEND_JOB_OPTIONS = {
  attempts: 4,
  backoff: { type: 'exponential' as const, delay: 30_000 },
  removeOnComplete: 1_000,
  removeOnFail: false,
};
