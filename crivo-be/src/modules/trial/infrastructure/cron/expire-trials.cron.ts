import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { ExpireTrialsUseCase } from '../../application/expire-trials.use-case';

/**
 * Primeiro cron do projeto.
 *
 * Roda de madrugada porque o efeito é bloquear acesso: fazê-lo no meio do
 * expediente tiraria a agenda da recepção no meio de um atendimento.
 *
 * Nunca lança: uma exceção não tratada aqui derrubaria o scheduler e
 * silenciaria todas as execuções seguintes.
 */
@Injectable()
export class ExpireTrialsCron {
  private readonly logger = new Logger(ExpireTrialsCron.name);

  constructor(private readonly expireTrials: ExpireTrialsUseCase) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM, { name: 'expire-trials' })
  async handle(): Promise<void> {
    try {
      await this.expireTrials.execute();
    } catch (error) {
      this.logger.error(`Falha ao expirar trials: ${error}`);
    }
  }
}
