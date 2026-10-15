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
      apiVersion: StripeLib.API_VERSION,
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

  /**
   * Troca o preço da assinatura **existente**, em vez de criar outra.
   *
   * Sem isto cada mudança de plano abria um checkout novo e o cliente ficava
   * com duas assinaturas ativas, pagando as duas (aconteceu de verdade:
   * três assinaturas simultâneas, R$ 727/mês, em 13/08/2026).
   *
   * `proration_behavior`:
   * - `always_invoice` no **upgrade**: cobra a diferença proporcional na
   *   hora e o acesso novo vale imediatamente.
   * - `none` no **downgrade**: o cliente já pagou o mês inteiro do plano
   *   maior, então mantém o acesso até o fim do ciclo. Sem isso ele perderia
   *   recurso que pagou.
   *
   * `currentPriceId` identifica **qual item é o plano-base**, entre os
   * itens da assinatura. Antes do profissional adicional existir, a
   * assinatura sempre teve exatamente um item e `items.data[0]` bastava; com
   * o adicional como segundo item, a posição no array deixa de ser
   * confiável (a ordem do Stripe não é garantida como "ordem de criação").
   * O preço atual, por outro lado, é uma informação que quem chama sempre
   * tem (é o `plan.stripePriceId` de onde a clínica está saindo).
   */
  async updateSubscriptionPrice(params: {
    subscriptionId: string;
    /** Preço do item de plano-base *antes* da troca — para achá-lo entre os itens. */
    currentPriceId: string;
    priceId: string;
    /** `false` agenda a troca para o fim do ciclo (downgrade). */
    immediate: boolean;
  }) {
    const subscription = await this.client.subscriptions.retrieve(
      params.subscriptionId,
    );
    const currentItem = subscription.items.data.find(
      (item) => item.price.id === params.currentPriceId,
    );

    if (!currentItem) {
      throw new Error(
        `Subscription ${params.subscriptionId} has no item with price ${params.currentPriceId}.`,
      );
    }

    return this.client.subscriptions.update(params.subscriptionId, {
      items: [{ id: currentItem.id, price: params.priceId }],
      proration_behavior: params.immediate ? 'always_invoice' : 'none',
    });
  }

  /**
   * Sincroniza a quantidade do item de profissional adicional na assinatura.
   *
   * Um item por preço, não por profissional: `quantity` é o número de
   * profissionais além dos incluídos no plano, e o Stripe calcula o valor
   * (`quantity × unit_amount`) sozinho — é a mesma modelagem que o
   * `line_items` do checkout usa para o plano-base.
   *
   * `quantity <= 0` **remove o item** em vez de deixá-lo com `quantity: 0`.
   * Zerado ele continuaria na assinatura indefinidamente (o Stripe permite
   * item com quantidade zero), e um item fantasma no Dashboard confundiria
   * qualquer investigação futura de cobrança. Sem itens de adicional em
   * aberto, o item nem existe.
   *
   * Sempre `proration_behavior: 'always_invoice'`: ao contrário da troca de
   * plano (onde o downgrade espera o ciclo por já ter sido pago), aqui não
   * existe "já pago" — o profissional a mais é cadastrado ou removido no
   * momento em que a clínica age, e a cobrança/crédito acompanha na hora.
   */
  async setExtraProfessionalsQuantity(params: {
    subscriptionId: string;
    extraPriceId: string;
    quantity: number;
  }) {
    const subscription = await this.client.subscriptions.retrieve(
      params.subscriptionId,
    );
    const existingItem = subscription.items.data.find(
      (item) => item.price.id === params.extraPriceId,
    );

    if (params.quantity <= 0) {
      if (!existingItem) return subscription; // nada a remover
      return this.client.subscriptions.update(params.subscriptionId, {
        items: [{ id: existingItem.id, deleted: true }],
        proration_behavior: 'always_invoice',
      });
    }

    return this.client.subscriptions.update(params.subscriptionId, {
      items: [
        existingItem
          ? { id: existingItem.id, quantity: params.quantity }
          : { price: params.extraPriceId, quantity: params.quantity },
      ],
      proration_behavior: 'always_invoice',
    });
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
