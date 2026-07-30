import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import {
  MESSAGE_PROVIDER,
  type MessageProvider,
} from '../../domain/provider/message-provider';
import {
  MESSAGE_REPOSITORY,
  type MessageRepository,
} from '../../domain/repository/message.repository';
import { MESSAGING_QUEUE, SendMessageJob } from './messaging.queue';

@Processor(MESSAGING_QUEUE)
export class MessageProcessor extends WorkerHost {
  private readonly logger = new Logger(MessageProcessor.name);

  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: MessageRepository,
    @Inject(MESSAGE_PROVIDER)
    private readonly provider: MessageProvider,
  ) {
    super();
  }

  async process(job: Job<SendMessageJob>): Promise<void> {
    const message = await this.messageRepository.findById(job.data.messageId);

    if (!message) {
      this.logger.warn(`Mensagem ${job.data.messageId} não existe mais.`);
      return;
    }

    // Já enviada: evita duplicar se o job for reprocessado.
    if (message.sentAt) {
      return;
    }

    await this.messageRepository.incrementAttempts(message.id);

    const result = await this.provider.send({
      toPhone: message.toPhone,
      body: message.body,
    });

    await this.messageRepository.markSent(message.id, {
      provider: this.provider.name,
      providerMessageId: result.providerMessageId,
    });
  }

  /**
   * Só marca FAILED quando o BullMQ esgotou as tentativas — antes disso o job
   * ainda vai ser retentado e a mensagem segue PENDING.
   */
  @OnWorkerEvent('failed')
  async onFailed(job: Job<SendMessageJob>, error: Error): Promise<void> {
    const isLastAttempt = job.attemptsMade >= (job.opts.attempts ?? 1);

    if (!isLastAttempt) {
      this.logger.warn(
        `Envio falhou (tentativa ${job.attemptsMade}), vai retentar: ${error.message}`,
      );
      return;
    }

    this.logger.error(
      `Envio falhou definitivamente para a mensagem ${job.data.messageId}: ${error.message}`,
    );

    await this.messageRepository.markFailed(job.data.messageId, error.message);
  }
}
