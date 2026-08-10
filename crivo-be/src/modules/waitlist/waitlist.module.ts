import { Module } from '@nestjs/common';

import { BullModule } from '@nestjs/bullmq';

import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { MessagingModule } from '../messaging/messaging.module';
import { MESSAGING_QUEUE } from '../messaging/infrastructure/queue/messaging.queue';
import { ManageWaitlistUseCase } from './application/manage-waitlist.use-case';
import { WaitlistController } from './infrastructure/http/waitlist.controller';

/**
 * Lista de espera: quem quer uma vaga que ainda não existe.
 *
 * Existe para o buraco que o cancelamento abre — hoje a consulta cancelada
 * na véspera simplesmente evapora, e a recepção não tem lista de quem
 * gostaria daquele horário.
 */
@Module({
  imports: [
    PrismaModule,
    // A oferta de vaga sai pelo mesmo canal (e mesma fila) das demais
    // mensagens. `messaging` não importa `waitlist`, então não há ciclo.
    MessagingModule,
    BullModule.registerQueue({ name: MESSAGING_QUEUE }),
  ],
  controllers: [WaitlistController],
  providers: [ManageWaitlistUseCase],
  exports: [ManageWaitlistUseCase],
})
export class WaitlistModule {}
