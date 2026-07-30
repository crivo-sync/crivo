export type SendMessageInput = {
  toPhone: string;
  body: string;
};

export type SendMessageResult = {
  /** Id da mensagem no provider, quando ele devolve um. */
  providerMessageId?: string;
};

export const MESSAGE_PROVIDER = 'MessageProvider';

/**
 * Contrato de envio. As implementações (fake, evolution, meta) são
 * intercambiáveis por env var — o resto do módulo não sabe qual está ativo.
 *
 * Erros de envio devem ser lançados: quem chama (o worker da fila) decide
 * sobre retry e sobre marcar a mensagem como FAILED.
 */
export type MessageProvider = {
  readonly name: string;
  send(input: SendMessageInput): Promise<SendMessageResult>;
};
