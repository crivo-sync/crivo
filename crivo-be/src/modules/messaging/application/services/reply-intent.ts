/**
 * O que o paciente quis dizer ao responder o lembrete.
 *
 * `UNKNOWN` é o caso mais importante: qualquer coisa fora do vocabulário
 * previsto ("posso remarcar?", "vou tentar chegar") **não** é confirmação.
 * Errar aqui confirma presença de quem não confirmou — a clínica reserva o
 * horário e o paciente falta assim mesmo, que é exatamente o problema que o
 * produto existe para reduzir.
 */
export type ReplyIntent = 'CONFIRM' | 'CANCEL' | 'UNKNOWN';

/**
 * Remove acento e caixa para "SIM", "sim" e "Sím" caírem no mesmo lugar.
 * `NFD` separa a letra do acento; o range remove só os diacríticos.
 */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * Vocabulário aceito. São frases inteiras, não pedaços: casar por `includes`
 * transformaria "não posso, sim?" em confirmação por conter "sim".
 */
const CONFIRM_PHRASES = new Set([
  'sim',
  's',
  '1',
  'ok',
  'okay',
  'confirmo',
  'confirmado',
  'confirmar',
  'confirma',
  'certo',
  'isso',
  'positivo',
  'vou',
  'vou sim',
  'estarei la',
  'confirmo presenca',
  'presenca confirmada',
  'pode confirmar',
  'ta confirmado',
  'sim confirmo',
  'sim, confirmo',
]);

const CANCEL_PHRASES = new Set([
  'nao',
  'n',
  '2',
  'cancelar',
  'cancela',
  'cancelo',
  'cancelado',
  'desmarcar',
  'desmarca',
  'desmarco',
  'nao vou',
  'nao posso',
  'nao poderei',
  'nao consigo',
  'negativo',
  'remarcar',
  'preciso remarcar',
  'quero remarcar',
]);

/**
 * Interpreta a resposta do paciente.
 *
 * Deliberadamente conservador: só reconhece o que é inequívoco. Uma mensagem
 * ambígua vira `UNKNOWN` e cai na caixa de entrada para a recepção ler — o
 * custo de não entender é um humano olhar; o de entender errado é um horário
 * bloqueado à toa ou uma consulta cancelada sem o paciente pedir.
 *
 * Emoji e pontuação são descartados: "Sim! 👍" é um sim.
 */
export function detectReplyIntent(body: string): ReplyIntent {
  const normalized = normalize(body)
    // Fora pontuação e emoji; sobra letra, número e espaço.
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return 'UNKNOWN';

  if (CONFIRM_PHRASES.has(normalized)) return 'CONFIRM';
  if (CANCEL_PHRASES.has(normalized)) return 'CANCEL';

  return 'UNKNOWN';
}
