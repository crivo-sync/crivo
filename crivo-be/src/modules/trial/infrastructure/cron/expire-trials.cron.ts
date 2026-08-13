import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { ExpireTrialsUseCase } from '../../application/expire-trials.use-case';
import { NotifyEndingTrialsUseCase } from '../../application/notify-ending-trials.use-case';

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

  constructor(
    private readonly expireTrials: ExpireTrialsUseCase,
    private readonly notifyEndingTrials: NotifyEndingTrialsUseCase,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM, { name: 'expire-trials' })
  async handle(): Promise<void> {
    try {
      await this.expireTrials.execute();
    } catch (error) {
      this.logger.error(`Falha ao expirar trials: ${error}`);
    }
  }

  /**
   * Aviso de "seu teste está acabando", 9h da manhã.
   *
   * Separado da expiração e em outro horário de propósito: este é um e-mail
   * que a pessoa deve **ler**, e mensagem que chega às 3h da manhã afunda na
   * caixa de entrada antes do expediente começar.
   */
  @Cron('0 9 * * *', { name: 'notify-ending-trials' })
  async notify(): Promise<void> {
    try {
      await this.notifyEndingTrials.execute();
    } catch (error) {
      this.logger.error(`Falha ao avisar sobre trials acabando: ${error}`);
    }
  }
}
