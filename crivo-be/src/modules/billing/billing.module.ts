import { Module } from '@nestjs/common';

import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { StripeService } from './infrastructure/stripe/stripe.service';
import { BillingController } from './infrastructure/http/billing.controller';
import { StripeWebhookController } from './infrastructure/http/stripe-webhook.controller';
import { CreateCheckoutSessionUseCase } from './application/use-cases/create-checkout-session.use-case';
import { HandleStripeWebhookUseCase } from './application/use-cases/handle-stripe-webhook.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [BillingController, StripeWebhookController],
  providers: [
    StripeService,
    CreateCheckoutSessionUseCase,
    HandleStripeWebhookUseCase,
  ],
})
export class BillingModule {}
