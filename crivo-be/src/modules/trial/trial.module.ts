import { Module } from '@nestjs/common';

import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { ExpireTrialsUseCase } from './application/expire-trials.use-case';
import { NotifyEndingTrialsUseCase } from './application/notify-ending-trials.use-case';
import { ExpireTrialsCron } from './infrastructure/cron/expire-trials.cron';

/**
 * Ciclo de vida do trial: expiração diária (3h) e aviso de "está acabando"
 * por e-mail (9h, D-3).
 *
 * O aviso por e-mail existe porque o banner do painel (`trial-banner.tsx`)
 * só alcança quem entra — quem parou de usar descobria o fim do teste com a
 * agenda travada.
 */
@Module({
  imports: [PrismaModule],
  providers: [ExpireTrialsUseCase, NotifyEndingTrialsUseCase, ExpireTrialsCron],
  exports: [ExpireTrialsUseCase],
})
export class TrialModule {}
