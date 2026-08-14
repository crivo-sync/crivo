import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { PredictionModule } from '../prediction/prediction.module';
import { createBullBoardAuthMiddleware } from '../../shared/bull-board/bull-board-auth.middleware';
import { AI_TEXT_GENERATOR } from './domain/ai/ai-text-generator';
import { MESSAGE_REPOSITORY } from './domain/repository/message.repository';
import { INBOUND_MESSAGE_REPOSITORY } from './domain/repository/inbound-message.repository';
import { PrismaMessageRepository } from './infrastructure/prisma/prisma-message.repository';
import { PrismaInboundMessageRepository } from './infrastructure/prisma/prisma-inbound-message.repository';
import { FakeMessageProvider } from './infrastructure/providers/fake-message.provider';
import { EvolutionMessageProvider } from './infrastructure/providers/evolution-message.provider';
import { MetaMessageProvider } from './infrastructure/providers/meta-message.provider';
import { DeepSeekTextGenerator } from './infrastructure/ai/deepseek-text-generator';
import { MessageProcessor } from './infrastructure/queue/message.processor';
import { MESSAGING_QUEUE } from './infrastructure/queue/messaging.queue';
import { MessageController } from './infrastructure/http/message.controller';
import { ConfirmationController } from './infrastructure/http/confirmation.controller';
import { InboundWebhookController } from './infrastructure/http/inbound-webhook.controller';
import { InboundMessageController } from './infrastructure/http/inbound-message.controller';
import { MessageTemplateController } from './infrastructure/http/message-template.controller';
import { WhatsAppConnectionController } from './infrastructure/http/whatsapp-connection.controller';
import { EvolutionInstanceClient } from './infrastructure/providers/evolution-instance.client';
import { ManageWhatsAppConnectionUseCase } from './application/use-cases/manage-whatsapp-connection.use-case';
import { MessageTemplateService } from './application/services/message-template.service';
import { MessageComposerService } from './application/services/message-composer.service';
import { MessageProviderResolver } from './application/services/message-provider-resolver.service';
import { ScheduleAppointmentReminderUseCase } from './application/use-cases/schedule-appointment-reminder.use-case';
import { ConfirmByTokenUseCase } from './application/use-cases/confirm-by-token.use-case';
import { GetMessagesUseCase } from './application/use-cases/get-messages.use-case';
import { ReceiveInboundMessageUseCase } from './application/use-cases/receive-inbound-message.use-case';
import { ConfirmByReplyUseCase } from './application/use-cases/confirm-by-reply.use-case';
import { GetInboundMessagesUseCase } from './application/use-cases/get-inbound-messages.use-case';
import { ManageTemplatesUseCase } from './application/use-cases/manage-templates.use-case';
import { ResendMessageUseCase } from './application/use-cases/resend-message.use-case';
import { CheckMessageQuotaUseCase } from './application/use-cases/check-message-quota.use-case';
import { GetConversationUseCase } from './application/use-cases/get-conversation.use-case';
import { SendManualMessageUseCase } from './application/use-cases/send-manual-message.use-case';
import { GuardsModule } from '../../shared/guards/guards.module';

@Module({
  imports: [
    PrismaModule,
    // O cronograma de lembretes depende da faixa de risco. `prediction` não
    // importa `messaging`, então não há ciclo.
    PredictionModule,
    GuardsModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST') ?? 'localhost',
          port: Number(config.get('REDIS_PORT') ?? 6379),
          password: config.get<string>('REDIS_PASSWORD') || undefined,
        },
      }),
    }),
    BullModule.registerQueue({ name: MESSAGING_QUEUE }),
    // Painel web da fila em /admin/queues — ver waiting/active/completed/
    // failed/delayed, corpo de cada job, e permite retry/remove manual.
    // Só fica de pé com BULL_BOARD_USER/PASSWORD configurados (ver
    // bull-board-auth.middleware.ts) — sem isso, nega tudo por padrão.
    BullBoardModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        route: '/admin/queues',
        adapter: ExpressAdapter,
        middleware: createBullBoardAuthMiddleware(config),
        boardOptions: {
          uiConfig: {
            // Sem isso o board só atualiza a lista de jobs quando você dá
            // F5 — força reconsultar a cada 3s, sem depender do usuário
            // achar o toggle na engrenagem.
            pollingInterval: { forceInterval: 3000 },
          },
        },
      }),
    }),
    BullBoardModule.forFeature({
      name: MESSAGING_QUEUE,
      adapter: BullMQAdapter,
    }),
  ],
  controllers: [
    MessageController,
    ConfirmationController,
    InboundWebhookController,
    InboundMessageController,
    MessageTemplateController,
    WhatsAppConnectionController,
  ],
  providers: [
    {
      provide: MESSAGE_REPOSITORY,
      useClass: PrismaMessageRepository,
    },
    {
      provide: INBOUND_MESSAGE_REPOSITORY,
      useClass: PrismaInboundMessageRepository,
    },
    FakeMessageProvider,
    EvolutionMessageProvider,
    MetaMessageProvider,
    MessageProviderResolver,
    MessageProcessor,
    MessageTemplateService,
    MessageComposerService,
    {
      // Um único generator hoje (DeepSeek), mas atrás de interface para
      // trocar de provider de IA sem tocar no resto do módulo.
      provide: AI_TEXT_GENERATOR,
      useClass: DeepSeekTextGenerator,
    },
    ScheduleAppointmentReminderUseCase,
    ConfirmByTokenUseCase,
    GetMessagesUseCase,
    ReceiveInboundMessageUseCase,
    ConfirmByReplyUseCase,
    GetInboundMessagesUseCase,
    ManageTemplatesUseCase,
    ResendMessageUseCase,
    CheckMessageQuotaUseCase,
    GetConversationUseCase,
    SendManualMessageUseCase,
    // Gestão da instância (parear/desconectar) fica fora do contrato
    // `MessageProvider`: parear por QR é específico da Evolution — na Meta
    // oficial o número é homologado no painel deles.
    EvolutionInstanceClient,
    ManageWhatsAppConnectionUseCase,
  ],
  // `MessageTemplateService` é exportado para a lista de espera montar o
  // texto da oferta de vaga sem duplicar formatação de data/hora.
  exports: [
    ScheduleAppointmentReminderUseCase,
    MESSAGE_REPOSITORY,
    MessageTemplateService,
    CheckMessageQuotaUseCase,
  ],
})
export class MessagingModule {}
