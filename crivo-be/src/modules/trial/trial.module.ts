import { Module } from '@nestjs/common';

import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { ExpireTrialsUseCase } from './application/expire-trials.use-case';
import { ExpireTrialsCron } from './infrastructure/cron/expire-trials.cron';

/**
 * Ciclo de vida do trial. Hoje só a expiração diária — o aviso à clínica
 * vive no painel (`trial-banner.tsx`), sem envio externo: clínica criada
 * pelo cadastro não tem telefone nem e-mail próprio, só o do usuário
 * admin, e o projeto não tem envio de e-mail.
 */
@Module({
  imports: [PrismaModule],
  providers: [ExpireTrialsUseCase, ExpireTrialsCron],
  exports: [ExpireTrialsUseCase],
})
export class TrialModule {}
