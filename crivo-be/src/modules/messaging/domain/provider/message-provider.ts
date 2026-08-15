export type SendMessageInput = {
  toPhone: string;
  body: string;
  /**
   * De qual número da clínica a mensagem sai.
   *
   * **Sem isto o produto não é multi-tenant de verdade**: a instância vinha
   * de variável de ambiente, então todas as clínicas enviariam pelo mesmo
   * WhatsApp — o paciente da Clínica A receberia mensagem do número da
   * Clínica B (achado em 13/08/2026, antes de existir a segunda clínica).
   *
   * Cada provider usa o campo que lhe cabe: `evolution` usa o nome da
   * instância pareada; `meta` usará o `phone_number_id` da conta. `null`
   * cai no padrão do servidor, que é o certo enquanto há uma clínica só.
   */
  sender?: {
    evolutionInstance: string | null;
  };
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
