import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { StripeService } from '../../infrastructure/stripe/stripe.service';

export type CreateCheckoutSessionInput = {
  tenantId: string;
  planId: string;
};

/**
 * Abre o checkout de assinatura para um plano específico.
 *
 * Cria (ou reaproveita) o Stripe Customer do tenant, e associa a sessão ao
 * tenant via `metadata` — não `client_reference_id` — porque é isso que o
 * webhook consegue ler de volta no `checkout.session.completed` (mesmo
 * padrão do snap-financial).
 */
@Injectable()
export class CreateCheckoutSessionUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly config: ConfigService,
  ) {}

  async execute(input: CreateCheckoutSessionInput): Promise<{ url: string }> {
    const [tenant, plan] = await Promise.all([
      this.prisma.tenant.findUniqueOrThrow({ where: { id: input.tenantId } }),
      this.prisma.plan.findUnique({ where: { id: input.planId } }),
    ]);

    if (!plan || !plan.isActive) {
      throw new NotFoundException('Plan not found.');
    }

    if (!plan.stripePriceId) {
      throw new BadRequestException(
        'This plan does not have a Stripe price configured yet.',
      );
    }

    let stripeCustomerId = tenant.stripeCustomerId;

    if (stripeCustomerId) {
      try {
        const existing = await this.stripe.retrieveCustomer(stripeCustomerId);
        if (existing.deleted) stripeCustomerId = null;
      } catch {
        // Customer sumiu do Stripe (ex.: banco de dev reseedado) — cria um novo.
        stripeCustomerId = null;
      }
    }

    if (!stripeCustomerId) {
      const customer = await this.stripe.createCustomer({
        email: tenant.email ?? `${tenant.subdomain}@sem-email.crivo`,
        metadata: { tenantId: tenant.id },
      });
      stripeCustomerId = customer.id;
      await this.prisma.tenant.update({
        where: { id: tenant.id },
        data: { stripeCustomerId },
      });
    }

    const appUrl = this.config.getOrThrow<string>('PUBLIC_APP_URL');

    const session = await this.stripe.createCheckoutSession({
      customerId: stripeCustomerId,
      priceId: plan.stripePriceId,
      successUrl: `${appUrl}/painel/configuracoes?checkout=success`,
      cancelUrl: `${appUrl}/painel/configuracoes?checkout=cancelled`,
      metadata: { tenantId: tenant.id, planId: plan.id },
    });

    if (!session.url) {
      throw new BadRequestException('Stripe did not return a checkout URL.');
    }

    return { url: session.url };
  }
}
