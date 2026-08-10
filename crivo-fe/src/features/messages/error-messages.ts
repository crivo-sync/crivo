/**
 * Tradução do erro técnico do provider para o que a recepção precisa saber.
 *
 * `lastError` guarda a resposta crua do WhatsApp ("Cannot read properties of
 * undefined (reading 'onWhatsApp')"), que é o que serve para depurar mas não
 * diz à atendente o que fazer. Cada regra abaixo responde duas perguntas:
 * o que aconteceu e de quem é a ação.
 *
 * O texto original continua guardado no banco e visível em "Detalhe técnico"
 * — traduzir na exibição, e não na gravação, evita perder o diagnóstico.
 */

type FriendlyError = {
  /** O que aconteceu, em uma frase. */
  title: string;
  /** O que fazer agora. */
  hint: string;
};

const FALLBACK: FriendlyError = {
  title: "Não foi possível enviar a mensagem.",
  hint: "Ligue para o paciente para confirmar a consulta e avise o suporte se continuar acontecendo.",
};

/**
 * Da mais específica para a mais genérica: a primeira regra que casar vence,
 * então padrões amplos (como "500") precisam ficar por último.
 */
const RULES: { match: RegExp; error: FriendlyError }[] = [
  {
    // `onWhatsApp` indefinido = a Evolution está no ar, mas o WhatsApp da
    // clínica não está conectado (sessão caiu ou o QR nunca foi lido).
    match: /onWhatsApp/i,
    error: {
      title: "O WhatsApp da clínica está desconectado.",
      hint: "Ninguém recebe mensagem enquanto isso. Peça para o responsável reconectar o WhatsApp e depois use “Reenviar mensagem”.",
    },
  },
  {
    match: /(ECONNREFUSED|ENOTFOUND|ETIMEDOUT|fetch failed|network)/i,
    error: {
      title: "Não conseguimos falar com o serviço de WhatsApp.",
      hint: "Costuma ser queda temporária. Tente “Reenviar mensagem” em alguns minutos; se persistir, ligue para o paciente.",
    },
  },
  {
    match: /(401|403|unauthorized|forbidden|invalid.*(token|key))/i,
    error: {
      title: "O acesso ao WhatsApp foi recusado.",
      hint: "É uma configuração do sistema, não do cadastro do paciente. Avise o suporte — reenviar agora não vai resolver.",
    },
  },
  {
    match: /(number.*not.*exist|not.*registered|invalid.*number|exists.*false)/i,
    error: {
      title: "Este número não tem WhatsApp.",
      hint: "Confira o telefone no cadastro do paciente e ligue para confirmar a consulta.",
    },
  },
  {
    match: /(rate.?limit|429|too many requests)/i,
    error: {
      title: "Muitas mensagens enviadas em pouco tempo.",
      hint: "O WhatsApp limitou os envios temporariamente. Aguarde alguns minutos antes de reenviar.",
    },
  },
  {
    match: /(500|internal server error|502|503|504)/i,
    error: {
      title: "O serviço de WhatsApp apresentou uma falha.",
      hint: "O problema é do lado do serviço, não do cadastro. Tente “Reenviar mensagem”; se continuar, ligue para o paciente.",
    },
  },
];

export function toFriendlyError(lastError?: string | null): FriendlyError {
  if (!lastError) return FALLBACK;

  return RULES.find((rule) => rule.match.test(lastError))?.error ?? FALLBACK;
}
