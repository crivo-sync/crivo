import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import StripeLib from 'stripe';

type StripeInstance = InstanceType<typeof StripeLib>;

type CreateCheckoutSessionParams = {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
};

type CreateBillingPortalSessionParams = {
  customerId: string;
  returnUrl: string;
};

/**
 * Wrapper fino sobre o SDK do Stripe. De propósito "burro": não engole
 * erros do SDK, quem decide o que fazer com uma falha é o use-case
 * chamador (mesmo padrão do snap-financial).
 */
@Injectable()
export class StripeService implements OnModuleInit {
  private client!: StripeInstance;
  private webhookSecret!: string;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const secretKey = this.config.getOrThrow<string>('STRIPE_SECRET_KEY');
    this.webhookSecret = this.config.getOrThrow<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    this.client = new StripeLib(secretKey, {
      apiVersion: '2026-07-29.dahlia',
    });
  }

  async createCustomer(params: {
    email: string;
    metadata: Record<string, string>;
  }) {
    return this.client.customers.create({
      email: params.email,
      metadata: params.metadata,
    });
  }

  async retrieveCustomer(customerId: string) {
    return this.client.customers.retrieve(customerId);
  }

  async createCheckoutSession(params: CreateCheckoutSessionParams) {
    return this.client.checkout.sessions.create({
      mode: 'subscription',
      customer: params.customerId,
      line_items: [{ price: params.priceId, quantity: 1 }],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata,
    });
  }

  async retrieveSubscription(subscriptionId: string) {
    return this.client.subscriptions.retrieve(subscriptionId);
  }

  async cancelSubscription(subscriptionId: string) {
    return this.client.subscriptions.cancel(subscriptionId);
  }

  async createBillingPortalSession(params: CreateBillingPortalSessionParams) {
    return this.client.billingPortal.sessions.create({
      customer: params.customerId,
      return_url: params.returnUrl,
    });
  }

  /** Lança se a assinatura não bater — nunca processe o body sem isso passar. */
  constructWebhookEvent(rawBody: Buffer, signature: string) {
    return this.client.webhooks.constructEvent(
      rawBody,
      signature,
      this.webhookSecret,
    );
  }
}
