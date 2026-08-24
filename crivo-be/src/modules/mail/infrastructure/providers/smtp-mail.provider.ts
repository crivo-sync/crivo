import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

import type { MailProvider, SendMailInput } from '../../domain/mail-provider';

/**
 * Envio por SMTP. Em desenvolvimento aponta para o **Mailtrap Sandbox**, que
 * captura tudo numa caixa de teste em vez de entregar — assim dá para ver o
 * HTML sem risco de mandar e-mail de teste para cliente real.
 *
 * Em produção é o mesmo código com outra credencial: o provedor muda, o
 * contrato não.
 */
@Injectable()
export class SmtpMailProvider implements MailProvider {
  readonly name = 'smtp';

  private readonly logger = new Logger(SmtpMailProvider.name);
  private transporter?: Transporter;

  constructor(private readonly config: ConfigService) {}

  /**
   * Criado sob demanda, não no boot: sem credencial configurada o módulo
   * inteiro subiria quebrado, e e-mail é acessório — a clínica precisa
   * conseguir operar mesmo sem ele.
   */
  private getTransporter(): Transporter | null {
    if (this.transporter) return this.transporter;

    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASSWORD');

    if (!host || !user || !pass) return null;

    this.transporter = createTransport({
      host,
      port: Number(this.config.get('SMTP_PORT') ?? 2525),
      auth: { user, pass },
    });

    return this.transporter;
  }

  async send(input: SendMailInput): Promise<void> {
    const transporter = this.getTransporter();

    if (!transporter) {
      // Sem SMTP configurado o e-mail vira log, não erro. É o que permite
      // rodar o projeto (e a suíte) sem credencial nenhuma.
      this.logger.warn(
        `SMTP não configurado — e-mail não enviado: "${input.subject}" para ${input.to}`,
      );
      return;
    }

    await transporter.sendMail({
      from:
        this.config.get<string>('MAIL_FROM') ??
        'Crivo Sync <nao-responda@crivo.app>',
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });

    this.logger.log(`E-mail enviado: "${input.subject}" para ${input.to}`);
  }
}
