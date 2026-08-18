import { Module } from '@nestjs/common';

import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { MessagingModule } from '../messaging/messaging.module';
import { StripeService } from './infrastructure/stripe/stripe.service';
import { BillingController } from './infrastructure/http/billing.controller';
import { StripeWebhookController } from './infrastructure/http/stripe-webhook.controller';
import { CreateCheckoutSessionUseCase } from './application/use-cases/create-checkout-session.use-case';
import { HandleStripeWebhookUseCase } from './application/use-cases/handle-stripe-webhook.use-case';
import { SyncExtraProfessionalsUseCase } from './application/use-cases/sync-extra-professionals.use-case';

@Module({
  // `MessagingModule` só para reusar `CheckMessageQuotaUseCase` — o
  // contador de uso mostrado em Configurações → Assinatura precisa da
  // mesma contagem que o `MessageProcessor` usa para bloquear envio.
  imports: [PrismaModule, MessagingModule],
  controllers: [BillingController, StripeWebhookController],
  providers: [
    StripeService,
    CreateCheckoutSessionUseCase,
    HandleStripeWebhookUseCase,
    SyncExtraProfessionalsUseCase,
  ],
  // `SyncExtraProfessionalsUseCase` para `ProfessionalsModule` chamar depois
  // de cadastrar/remover — cobrar o adicional é responsabilidade de
  // `billing`, não algo que `professionals` deveria reimplementar.
  exports: [SyncExtraProfessionalsUseCase],
})
export class BillingModule {}
