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
 * Ou manda para o checkout (primeira assinatura), ou confirma a troca de
 * plano feita direto na assinatura existente.
 */
export type CheckoutOrChangeResult =
  { kind: 'checkout'; url: string } | { kind: 'changed'; message: string };

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

  async execute(
    input: CreateCheckoutSessionInput,
  ): Promise<CheckoutOrChangeResult> {
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

    if (tenant.planId === plan.id) {
      throw new BadRequestException('Este já é o plano contratado.');
    }

    /**
     * **Downgrade** não passa pelo checkout: o cliente já pagou o mês do
     * plano maior, e cobrar de novo para descer de plano seria absurdo. A
     * assinatura existente é atualizada e a troca vale no fim do ciclo.
     *
     * **Upgrade e primeira assinatura** vão para o checkout do Stripe: é onde
     * o cliente vê o que está sendo cobrado e confirma o pagamento. A
     * assinatura anterior é cancelada pelo webhook, quando a nova confirma —
     * ver `handleCheckoutCompleted`. Sem isso ficariam duas ativas e o
     * cliente pagaria as duas (aconteceu: três simultâneas, R$ 727/mês).
     */
    if (tenant.stripeSubscriptionId && tenant.planId) {
      const current = await this.prisma.plan.findUnique({
        where: { id: tenant.planId },
        select: { name: true, priceInCents: true, stripePriceId: true },
      });

      const isDowngrade = !!current && plan.priceInCents < current.priceInCents;

      if (isDowngrade) {
        if (!current.stripePriceId) {
          throw new BadRequestException(
            'O plano atual não tem preço configurado no Stripe.',
          );
        }

        return this.scheduleDowngrade(
          tenant.stripeSubscriptionId,
          plan.name,
          current.stripePriceId,
          plan.stripePriceId,
          current.name,
        );
      }
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

    return { kind: 'checkout', url: session.url };
  }

  /**
   * Downgrade: agenda a troca sem cobrar nada agora.
   *
   * `immediate: false` → `proration_behavior: 'none'`, então o cliente
   * mantém os recursos do plano maior até o fim do período já pago. O
   * `planId` no banco **não** muda aqui: quem grava é o webhook
   * `customer.subscription.updated`, quando o ciclo virar. Rebaixar agora
   * tiraria recurso que já foi pago.
   */
  private async scheduleDowngrade(
    subscriptionId: string,
    targetPlanName: string,
    currentPriceId: string,
    targetPriceId: string,
    currentPlanName: string,
  ): Promise<CheckoutOrChangeResult> {
    await this.stripe.updateSubscriptionPrice({
      subscriptionId,
      currentPriceId,
      priceId: targetPriceId,
      immediate: false,
    });

    return {
      kind: 'changed',
      message:
        `Mudança para ${targetPlanName} agendada. Você continua com os ` +
        `recursos do plano ${currentPlanName} até o fim do período já pago.`,
    };
  }
}
