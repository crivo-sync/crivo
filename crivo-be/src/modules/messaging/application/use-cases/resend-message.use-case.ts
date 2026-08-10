import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { MessageStatus } from '@prisma/client';
import { Queue } from 'bullmq';

import {
  MESSAGE_REPOSITORY,
  type MessageRepository,
} from '../../domain/repository/message.repository';
import {
  MESSAGING_QUEUE,
  SEND_JOB_OPTIONS,
} from '../../infrastructure/queue/messaging.queue';

/**
 * Reenvio manual de uma mensagem que falhou.
 *
 * Existe porque a lista "ligar para estes pacientes" era um beco sem saída:
 * a recepção via a falha mas só podia agir por fora do sistema. O retry
 * existia apenas no Bull Board — ferramenta de dev, protegida por Basic Auth
 * e que expõe a fila inteira.
 */
@Injectable()
export class ResendMessageUseCase {
  private readonly logger = new Logger(ResendMessageUseCase.name);

  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: MessageRepository,
    @InjectQueue(MESSAGING_QUEUE) private readonly queue: Queue,
  ) {}

  async execute(id: string, tenantId: string): Promise<void> {
    const message = await this.messageRepository.findById(id);

    // Checar o tenant aqui (e não só o id) é o que impede uma clínica de
    // disparar mensagem de outra sabendo o UUID.
    if (!message || message.tenantId !== tenantId) {
      throw new NotFoundException('Mensagem não encontrada.');
    }

    if (message.status !== MessageStatus.FAILED) {
      // Reenviar uma SENT duplicaria a mensagem no WhatsApp do paciente, e
      // uma PENDING já está na fila — nos dois casos o certo é recusar em vez
      // de criar um segundo envio silencioso.
      throw new BadRequestException(
        'Só é possível reenviar mensagens que falharam.',
      );
    }

    await this.messageRepository.resetForRetry(id);

    // `SEND_JOB_OPTIONS` usa `removeOnFail: false`, então o job antigo (com
    // este mesmo `jobId`) continua na fila como falho — e o BullMQ ignora um
    // `add` com id repetido. Sem remover primeiro, o reenvio não aconteceria
    // e a tela mostraria sucesso sem nada ter saído.
    try {
      await this.queue.remove(id);
    } catch {
      this.logger.warn(
        `Job antigo da mensagem ${id} não pôde ser removido — seguindo com o reenvio.`,
      );
    }

    await this.queue.add(
      'send',
      { messageId: id },
      { ...SEND_JOB_OPTIONS, jobId: id },
    );

    this.logger.log(`Reenvio manual solicitado para a mensagem ${id}`);
  }
}
