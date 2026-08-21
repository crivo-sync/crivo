import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SubscriptionStatus } from '@prisma/client';

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
 * Assinatura "viva" é a que está cobrando (ou devendo): só nela o plano
 * corrente é o que o cliente paga hoje e vale a troca na mesma assinatura.
 *
 * `CANCELED`/`EXPIRED` não contam — sem assinatura ativa, escolher um plano
 * precisa abrir checkout novo (reassinatura). `TRIALING` também não:
 * `planId` escolhido no cadastro é só teto de trial, nunca pagamento.
 */
function isLiveSubscription(status: SubscriptionStatus): boolean {
  return (
    status === SubscriptionStatus.ACTIVE ||
    status === SubscriptionStatus.PAST_DUE
  );
}

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

    if (
      tenant.planId === plan.id &&
      isLiveSubscription(tenant.subscriptionStatus)
    ) {
      throw new BadRequestException('Este já é o plano contratado.');
    }

    /**
     * Com assinatura existente, a troca é feita na MESMA assinatura — nunca
     * se abre checkout novo, que criaria uma segunda assinatura ativa e
     * cobraria as duas (aconteceu: três simultâneas, R$ 727/mês).
     *
     * Upgrade e downgrade diferem só no momento da cobrança:
     * - **Upgrade** (immediate): cobra a **diferença proporcional** na hora
     *   (`proration_behavior: always_invoice`) e o plano novo vale já. Antes
     *   o upgrade ia para o checkout, que cria assinatura NOVA cobrando o
     *   mês cheio do plano novo E cancela a antiga sem crédito — o cliente
     *   pagava o mês inteiro do novo + perdia o resto do já pago (bug de
     *   20/08/2026).
     * - **Downgrade** (immediate: false): `proration_behavior: none` — o
     *   cliente já pagou o mês do plano maior e mantém o acesso até o fim do
     *   ciclo; quem grava o plano novo é o webhook `customer.subscription.updated`.
     *
     * Só a **primeira assinatura** passa pelo checkout (é onde o cliente vê
     * o valor e confirma o pagamento).
     */
    if (
      tenant.stripeSubscriptionId &&
      tenant.planId &&
      isLiveSubscription(tenant.subscriptionStatus)
    ) {
      const current = await this.prisma.plan.findUnique({
        where: { id: tenant.planId },
        select: { name: true, priceInCents: true, stripePriceId: true },
      });

      const isDowngrade = !!current && plan.priceInCents < current.priceInCents;

      if (current && current.stripePriceId) {
        return isDowngrade
          ? this.scheduleDowngrade(
              tenant.stripeSubscriptionId,
              plan.name,
              current.stripePriceId,
              plan.stripePriceId,
              current.name,
            )
          : this.applyUpgrade(
              tenant.stripeSubscriptionId,
              plan.name,
              current.stripePriceId,
              plan.stripePriceId,
            );
      }

      // Plano atual sem preço no Stripe: mantém o comportamento antigo.
      if (isDowngrade) {
        throw new BadRequestException(
          'O plano atual não tem preço configurado no Stripe.',
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

  /**
   * Upgrade: cobra a diferença proporcional na hora e o plano vale já.
   *
   * `immediate: true` → `proration_behavior: 'always_invoice'`: o Stripe
   * gera uma fatura da diferença e cobra no cartão em arquivo. O `planId`
   * no banco NÃO muda aqui — quem grava é o webhook
   * `customer.subscription.updated`, que também dispara o e-mail de
   * confirmação com os dados do plano novo (mesmo padrão do downgrade,
   * só que imediato).
   */
  private async applyUpgrade(
    subscriptionId: string,
    targetPlanName: string,
    currentPriceId: string,
    targetPriceId: string,
  ): Promise<CheckoutOrChangeResult> {
    await this.stripe.updateSubscriptionPrice({
      subscriptionId,
      currentPriceId,
      priceId: targetPriceId,
      immediate: true,
    });

    return {
      kind: 'changed',
      message:
        `Upgrade para ${targetPlanName} confirmado. A diferença ` +
        `proporcional foi cobrada no seu cartão e o plano novo já vale.`,
    };
  }
}
