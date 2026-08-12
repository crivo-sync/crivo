import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type Stripe from 'stripe';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { StripeService } from '../../infrastructure/stripe/stripe.service';
import { mapStripeStatus } from '../map-stripe-status';

export type HandleStripeWebhookInput = {
  rawBody: Buffer;
  signature: string;
};

/**
 * Processa eventos do Stripe. A assinatura é validada de forma síncrona
 * (precisa ser rápido); o resto roda depois, sem bloquear a resposta HTTP
 * — o Stripe reentrega o evento se não receber 200 em ~20s.
 *
 * Toda escrita usa uma chave vinda do próprio Stripe como fonte de
 * idempotência (`stripeSubscriptionId` no tenant), então reprocessar o
 * mesmo evento nunca duplica nada.
 */
@Injectable()
export class HandleStripeWebhookUseCase {
  private readonly logger = new Logger(HandleStripeWebhookUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
  ) {}

  async execute(input: HandleStripeWebhookInput): Promise<void> {
    let event: Stripe.Event;

    try {
      event = this.stripe.constructWebhookEvent(input.rawBody, input.signature);
    } catch {
      throw new BadRequestException('Invalid Stripe webhook signature.');
    }

    this.logger.log(`Stripe event received: ${event.type}`);

    try {
      await this.processEvent(event);
    } catch (error) {
      this.logger.error(
        `Failed to process Stripe event ${event.type}: ${error}`,
      );
    }
  }

  private async processEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;
      default:
        this.logger.debug(`Unhandled Stripe event type: ${event.type}`);
    }
  }

  private async handleCheckoutCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const tenantId = session.metadata?.tenantId;
    const planId = session.metadata?.planId;
    const stripeSubscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;
    const stripeCustomerId =
      typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id;

    if (!tenantId || !planId || !stripeSubscriptionId) {
      this.logger.warn(
        `checkout.session.completed missing tenantId/planId/subscriptionId (session ${session.id})`,
      );
      return;
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) {
      this.logger.warn(
        `checkout.session.completed for unknown tenant ${tenantId}`,
      );
      return;
    }

    const stripeSub =
      await this.stripe.retrieveSubscription(stripeSubscriptionId);

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        planId,
        stripeCustomerId: stripeCustomerId ?? tenant.stripeCustomerId,
        stripeSubscriptionId,
        subscriptionStatus: mapStripeStatus(stripeSub.status),
      },
    });
  }

  private async handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!tenant) {
      this.logger.warn(
        `customer.subscription.updated for unknown subscription ${subscription.id}`,
      );
      return;
    }

    await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: { subscriptionStatus: mapStripeStatus(subscription.status) },
    });
  }

  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!tenant) return;

    await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: { subscriptionStatus: 'CANCELED' },
    });
  }
}
