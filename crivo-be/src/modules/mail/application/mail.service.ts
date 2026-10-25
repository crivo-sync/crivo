import { Inject, Injectable, Logger } from '@nestjs/common';

import { MAIL_PROVIDER, type MailProvider } from '../domain/mail-provider';
import type { RenderedMail } from './templates';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(@Inject(MAIL_PROVIDER) private readonly provider: MailProvider) {}

  /**
   * Envia sem nunca lançar.
   *
   * Todo e-mail daqui é **acessório à operação que o disparou**: confirmar
   * uma assinatura, criar uma conta, avisar do trial. Deixar uma falha de
   * SMTP derrubar o pagamento que acabou de ser aprovado seria trocar um
   * problema pequeno (e-mail não chegou) por um grave (cliente pagou e a
   * assinatura não ativou).
   *
   * A falha vira log — que é onde se investiga "por que o cliente não
   * recebeu".
   */
  async send(to: string, mail: RenderedMail): Promise<void> {
    try {
      await this.provider.send({
        to,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      });
    } catch (error) {
      this.logger.error(
        `Falha ao enviar "${mail.subject}" para ${to}: ${
          error instanceof Error ? error.message : 'erro desconhecido'
        }`,
      );
    }
  }
}
