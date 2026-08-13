import { Global, Module } from '@nestjs/common';

import { MailService } from './application/mail.service';
import { MAIL_PROVIDER } from './domain/mail-provider';
import { SmtpMailProvider } from './infrastructure/providers/smtp-mail.provider';

/**
 * `@Global` porque e-mail é infraestrutura transversal: auth, billing e trial
 * disparam mensagem, e nenhum deles tem relação de domínio com os outros.
 * Importar o módulo em cada um só adicionaria ruído.
 */
@Global()
@Module({
  providers: [{ provide: MAIL_PROVIDER, useClass: SmtpMailProvider }, MailService],
  exports: [MailService],
})
export class MailModule {}
