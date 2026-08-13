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
  | { kind: 'checkout'; url: string }
  | { kind: 'changed'; message: string };

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
     * Já tem assinatura: **troca o preço dela**, não abre checkout novo.
     *
     * Abrir checkout criaria uma segunda assinatura ativa e o cliente pagaria
     * as duas — aconteceu de verdade (três simultâneas, R$ 727/mês).
     */
    if (tenant.stripeSubscriptionId) {
      return this.changePlan(tenant.id, tenant.stripeSubscriptionId, {
        id: plan.id,
        name: plan.name,
        priceInCents: plan.priceInCents,
        // Já validado acima; o TS não estreita através do `plan` inteiro.
        stripePriceId: plan.stripePriceId,
      });
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
   * Troca de plano numa assinatura que já existe.
   *
   * **Upgrade vale na hora; downgrade só no fim do ciclo.** O cliente já
   * pagou o mês inteiro do plano maior — rebaixar imediatamente tiraria
   * recurso que ele pagou. Por isso o `planId` no banco só muda no upgrade:
   * no downgrade a troca fica agendada no Stripe, e o webhook
   * `customer.subscription.updated` grava o plano novo quando o ciclo virar.
   */
  private async changePlan(
    tenantId: string,
    subscriptionId: string,
    plan: { id: string; name: string; priceInCents: number; stripePriceId: string },
  ): Promise<CheckoutOrChangeResult> {
    const current = await this.prisma.tenant
      .findUniqueOrThrow({
        where: { id: tenantId },
        select: { plan: { select: { priceInCents: true, name: true } } },
      })
      .then((t) => t.plan);

    const isUpgrade = plan.priceInCents > (current?.priceInCents ?? 0);

    await this.stripe.updateSubscriptionPrice({
      subscriptionId,
      priceId: plan.stripePriceId,
      immediate: isUpgrade,
    });

    if (isUpgrade) {
      // Acesso novo vale imediatamente — o Stripe já cobrou a diferença.
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { planId: plan.id },
      });

      return {
        kind: 'changed',
        message: `Plano alterado para ${plan.name}. O acesso já está liberado.`,
      };
    }

    return {
      kind: 'changed',
      message:
        `Mudança para ${plan.name} agendada. Você continua com os recursos do ` +
        `plano ${current?.name ?? 'atual'} até o fim do período já pago.`,
    };
  }
}
