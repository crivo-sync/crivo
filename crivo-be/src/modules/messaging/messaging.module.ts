import { BullModule } from '@nestjs/bullmq';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { AI_TEXT_GENERATOR } from './domain/ai/ai-text-generator';
import { MESSAGE_PROVIDER } from './domain/provider/message-provider';
import { MESSAGE_REPOSITORY } from './domain/repository/message.repository';
import { PrismaMessageRepository } from './infrastructure/prisma/prisma-message.repository';
import { FakeMessageProvider } from './infrastructure/providers/fake-message.provider';
import { EvolutionMessageProvider } from './infrastructure/providers/evolution-message.provider';
import { MetaMessageProvider } from './infrastructure/providers/meta-message.provider';
import { DeepSeekTextGenerator } from './infrastructure/ai/deepseek-text-generator';
import { MessageProcessor } from './infrastructure/queue/message.processor';
import { MESSAGING_QUEUE } from './infrastructure/queue/messaging.queue';
import { MessageController } from './infrastructure/http/message.controller';
import { ConfirmationController } from './infrastructure/http/confirmation.controller';
import { MessageTemplateService } from './application/services/message-template.service';
import { MessageComposerService } from './application/services/message-composer.service';
import { ScheduleAppointmentReminderUseCase } from './application/use-cases/schedule-appointment-reminder.use-case';
import { ConfirmByTokenUseCase } from './application/use-cases/confirm-by-token.use-case';
import { GetMessagesUseCase } from './application/use-cases/get-messages.use-case';

@Module({
  imports: [
    PrismaModule,
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
  ],
  controllers: [MessageController, ConfirmationController],
  providers: [
    {
      provide: MESSAGE_REPOSITORY,
      useClass: PrismaMessageRepository,
    },
    FakeMessageProvider,
    EvolutionMessageProvider,
    MetaMessageProvider,
    {
      // Provider escolhido por env var: fake (padrão) | evolution | meta.
      provide: MESSAGE_PROVIDER,
      inject: [
        ConfigService,
        FakeMessageProvider,
        EvolutionMessageProvider,
        MetaMessageProvider,
      ],
      useFactory: (
        config: ConfigService,
        fake: FakeMessageProvider,
        evolution: EvolutionMessageProvider,
        meta: MetaMessageProvider,
      ) => {
        const selected = config.get<string>('MESSAGING_PROVIDER') ?? 'fake';
        const logger = new Logger('MessagingModule');

        switch (selected) {
          case 'meta':
            logger.log('Provider de mensagens: Meta Cloud API (oficial)');
            return meta;
          case 'evolution':
            logger.warn(
              'Provider de mensagens: Evolution API (NÃO oficial) — apenas desenvolvimento',
            );
            return evolution;
          default:
            logger.log(
              'Provider de mensagens: fake (nada é enviado de verdade)',
            );
            return fake;
        }
      },
    },
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
  ],
  exports: [ScheduleAppointmentReminderUseCase, MESSAGE_REPOSITORY],
})
export class MessagingModule {}
