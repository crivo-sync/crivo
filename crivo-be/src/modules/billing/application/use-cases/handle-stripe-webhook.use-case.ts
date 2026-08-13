import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type Stripe from 'stripe';

import { ConfigService } from '@nestjs/config';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { MailService } from 'src/modules/mail/application/mail.service';
import {
  paymentFailedMail,
  subscriptionConfirmedMail,
} from 'src/modules/mail/application/templates';
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
    private readonly mail: MailService,
    private readonly config: ConfigService,
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

    await this.notifySubscriptionConfirmed(tenantId, planId, stripeSub);
  }

  /**
   * Recibo da assinatura para o admin da clínica.
   *
   * Depois do `update`, nunca antes: o e-mail confirma um estado que já está
   * gravado. Se falhar, o pagamento continua válido — `MailService.send` não
   * lança, e o webhook precisa devolver 200 para o Stripe parar de reentregar.
   */
  private async notifySubscriptionConfirmed(
    tenantId: string,
    planId: string,
    stripeSub: Stripe.Subscription,
  ): Promise<void> {
    const [tenant, plan] = await Promise.all([
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          name: true,
          // O e-mail vai para quem assinou, e quem assina é ADMIN.
          users: {
            where: { role: 'ADMIN', isActive: true },
            select: { email: true },
            orderBy: { createdAt: 'asc' },
            take: 1,
          },
        },
      }),
      this.prisma.plan.findUnique({ where: { id: planId } }),
    ]);

    const email = tenant?.users[0]?.email;
    if (!tenant || !plan || !email) return;

    // `current_period_end` vem em segundos; ausente em alguns estados.
    const periodEnd = (stripeSub as { current_period_end?: number })
      .current_period_end;

    await this.mail.send(
      email,
      subscriptionConfirmedMail({
        clinicName: tenant.name,
        planName: plan.name,
        priceInCents: plan.priceInCents,
        nextChargeAt: periodEnd ? new Date(periodEnd * 1000) : null,
        messageQuota: plan.maxMessagesPerMonth,
        maxProfessionals: plan.maxProfessionals,
      }),
    );
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

    const status = mapStripeStatus(subscription.status);

    await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: { subscriptionStatus: status },
    });

    // Só avisa na virada para PAST_DUE. O Stripe reenvia `updated` a cada
    // tentativa de cobrança, e sem comparar com o status anterior a clínica
    // receberia o mesmo e-mail de falha várias vezes seguidas.
    if (status === 'PAST_DUE' && tenant.subscriptionStatus !== 'PAST_DUE') {
      await this.notifyPaymentFailed(tenant.id);
    }
  }

  private async notifyPaymentFailed(tenantId: string): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        name: true,
        plan: { select: { name: true } },
        users: {
          where: { role: 'ADMIN', isActive: true },
          select: { email: true },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });

    const email = tenant?.users[0]?.email;
    if (!tenant || !email) return;

    const appUrl =
      this.config.get<string>('PUBLIC_APP_URL') ?? 'http://localhost:3000';

    await this.mail.send(
      email,
      paymentFailedMail({
        clinicName: tenant.name,
        planName: tenant.plan?.name ?? 'atual',
        billingUrl: `${appUrl.replace(/\/$/, '')}/painel/configuracoes`,
      }),
    );
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
