export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  /** Alternativa em texto puro — cliente de e-mail antigo e antispam olham. */
  text: string;
};

export const MAIL_PROVIDER = 'MailProvider';

/**
 * Contrato de envio de e-mail. Mesmo padrão do `MessageProvider` do WhatsApp:
 * implementações intercambiáveis por env var, e o resto do código não sabe
 * qual está ativa.
 *
 * Erros devem ser lançados; quem chama decide o que fazer. Nenhum e-mail
 * transacional aqui é crítico o bastante para derrubar a operação que o
 * originou — assinar um plano precisa funcionar mesmo com o SMTP fora do ar.
 */
export type MailProvider = {
  readonly name: string;
  send(input: SendMailInput): Promise<void>;
};
