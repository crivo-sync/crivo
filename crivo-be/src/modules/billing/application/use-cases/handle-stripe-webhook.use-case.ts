import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type Stripe from 'stripe';

import { ConfigService } from '@nestjs/config';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { MailService } from 'src/modules/mail/application/mail.service';
import {
  paymentFailedMail,
  professionalsOverLimitMail,
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

    /**
     * Troca de plano: a assinatura antiga precisa morrer.
     *
     * O checkout do Stripe sempre cria uma assinatura nova — não substitui a
     * anterior. Sem cancelar aqui, o cliente fica com duas ativas e paga as
     * duas (aconteceu: três simultâneas, R$ 727/mês, sem nada na tela
     * indicando).
     *
     * Cancelamento **antes** de gravar a nova no banco: se falhar, o tenant
     * continua apontando para a antiga e o `stripe:pull` detecta a
     * divergência. Gravando primeiro, uma falha aqui deixaria a antiga
     * cobrando sem ninguém sabendo.
     */
    const anterior = tenant.stripeSubscriptionId;

    if (anterior && anterior !== stripeSubscriptionId) {
      try {
        await this.stripe.cancelSubscription(anterior);
        this.logger.log(
          `Assinatura anterior ${anterior} cancelada após troca de plano.`,
        );
      } catch (error) {
        // Não interrompe: o pagamento novo já aconteceu e precisa valer. A
        // antiga fica registrada no log para reparo manual.
        this.logger.error(
          `FALHA ao cancelar a assinatura anterior ${anterior} do tenant ` +
            `${tenantId} — pode estar cobrando em duplicidade: ${error}`,
        );
      }
    }

    /**
     * Desliga a IA se o plano novo não a inclui.
     *
     * `aiMessagesEnabled` é um toggle que a clínica liga em Configurações —
     * nada aqui o desligava automaticamente quando o plano mudava. Uma
     * clínica que ligou em trial (que libera tudo) e depois assinou um
     * plano sem IA continuava com o toggle marcado no banco: o envio já
     * respeitava `plan.hasAiMessages` (não gastava DeepSeek à toa), mas a
     * tela mentia mostrando "ligado" — achado em 17/08/2026 com um tenant
     * real nessa exata situação.
     */
    const planNovo = await this.prisma.plan.findUnique({
      where: { id: planId },
      select: { hasAiMessages: true },
    });

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        planId,
        stripeCustomerId: stripeCustomerId ?? tenant.stripeCustomerId,
        stripeSubscriptionId,
        subscriptionStatus: mapStripeStatus(stripeSub.status),
        ...(planNovo && !planNovo.hasAiMessages
          ? { aiMessagesEnabled: false }
          : {}),
      },
    });

    /**
     * **Não cobra adicional pelo excedente** — o teto voltou a ser duro em
     * 17/08 (ver `CreateProfessionalUseCase`), e cobrar aqui recriaria pela
     * porta do webhook exatamente o bug que foi revertido: a clínica passa
     * do limite e descobre na fatura.
     *
     * A clínica que assina um plano menor do que a equipe que já cadastrou
     * (o caso comum: testou o trial com 10 profissionais e assinou o Solo)
     * fica **acima do teto**, e quem resolve isso é ela, escolhendo quem
     * continua ativo em `POST /professionals/over-limit/resolve`. O painel
     * detecta o estado por `GET /professionals/over-limit` e bloqueia até a
     * escolha ser feita. Aqui só avisamos por e-mail — desativar alguém por
     * conta própria acertaria o número e erraria a clínica.
     */
    await this.notifyOverLimitIfNeeded(tenantId, planId);

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

    /**
     * O preço da assinatura é a fonte da verdade do plano.
     *
     * Cobre os dois casos de troca: o upgrade (imediato, `always_invoice`) e
     * o **downgrade agendado**, que só chega quando o ciclo pago vira — é
     * este evento que efetiva a perda de recurso, no momento certo.
     *
     * O plano-base é o item cujo preço bate com `Plan.stripePriceId`. NÃO
     * usar `items.data[0]`: com o item de profissional adicional na
     * assinatura (2+ itens), a posição 0 pode ser o adicional e o plano
     * nunca seria resolvido — a cobrança mudaria sem o `planId` acompanhar
     * (divergência cobrança × banco). A ordem do Stripe não é garantida
     * como "ordem de criação".
     */
    const priceIds = subscription.items.data
      .map((item) => item.price?.id)
      .filter((id): id is string => Boolean(id));
    const planFromPrice = priceIds.length
      ? await this.prisma.plan.findFirst({
          where: { stripePriceId: { in: priceIds } },
        })
      : null;

    const planChanged = planFromPrice && planFromPrice.id !== tenant.planId;

    await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        subscriptionStatus: status,
        ...(planFromPrice ? { planId: planFromPrice.id } : {}),
      },
    });

    // Só avisa na virada para PAST_DUE. O Stripe reenvia `updated` a cada
    // tentativa de cobrança, e sem comparar com o status anterior a clínica
    // receberia o mesmo e-mail de falha várias vezes seguidas.
    if (status === 'PAST_DUE' && tenant.subscriptionStatus !== 'PAST_DUE') {
      await this.notifyPaymentFailed(tenant.id);
      return;
    }

    // Mudou de plano (upgrade ou downgrade que venceu): manda o mesmo recibo
    // da assinatura, agora com os dados do plano novo.
    if (planChanged) {
      await this.notifySubscriptionConfirmed(
        tenant.id,
        planFromPrice.id,
        subscription,
      );

      /**
       * O **downgrade agendado** efetiva por aqui, não pelo checkout — e é
       * justamente ele que cria excedente sem a clínica agir: ela pediu a
       * troca semanas antes, o ciclo virou hoje, e a equipe que cabia no
       * plano antigo não cabe mais no novo. Sem este aviso, o agendamento
       * simplesmente parava de funcionar no dia da virada e ela descobriria
       * pela recepção, não por nós.
       */
      await this.notifyOverLimitIfNeeded(tenant.id, planFromPrice.id);
    }
  }

  /**
   * Avisa quando a equipe cadastrada não cabe no plano recém-assinado.
   *
   * Só avisa — não desativa ninguém. O painel bloqueia e pede a escolha no
   * próximo acesso (`GET /professionals/over-limit`); o e-mail existe para
   * quem fechou a aba depois de pagar e não voltaria tão cedo, que é
   * justamente quem descobriria o problema tarde demais.
   *
   * Não lança: `MailService.send` já engole a falha, e o webhook precisa
   * devolver 200 para o Stripe parar de reentregar um pagamento que já foi
   * gravado com sucesso.
   */
  private async notifyOverLimitIfNeeded(
    tenantId: string,
    planId: string,
  ): Promise<void> {
    const [tenant, plan] = await Promise.all([
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          name: true,
          users: {
            where: { role: 'ADMIN', isActive: true },
            select: { email: true },
            orderBy: { createdAt: 'asc' },
            take: 1,
          },
        },
      }),
      this.prisma.plan.findUnique({
        where: { id: planId },
        select: { name: true, maxProfessionals: true },
      }),
    ]);

    const email = tenant?.users[0]?.email;
    if (!tenant || !plan || !email || plan.maxProfessionals === null) return;

    const activeCount = await this.prisma.professional.count({
      where: { tenantId, deletedAt: null, isActive: true },
    });

    if (activeCount <= plan.maxProfessionals) return;

    const appUrl =
      this.config.get<string>('PUBLIC_APP_URL') ?? 'http://localhost:3000';

    this.logger.log(
      `Tenant ${tenantId} assinou ${plan.name} (limite ${plan.maxProfessionals}) com ${activeCount} profissionais ativos — aviso de excedente enviado.`,
    );

    await this.mail.send(
      email,
      professionalsOverLimitMail({
        clinicName: tenant.name,
        planName: plan.name,
        activeCount,
        maxProfessionals: plan.maxProfessionals,
        professionalsUrl: `${appUrl.replace(/\/$/, '')}/painel/profissionais`,
      }),
    );
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
      data: {
        subscriptionStatus: 'CANCELED',
        // Sem assinatura ativa, o tenant deixa de ter plano contratado e
        // assinatura no Stripe. Sem limpar, o "Este já é o plano
        // contratado." do checkout impedia a clínica de REASSINAR o próprio
        // plano depois de cancelar/vencer — e a assinatura morta fazia o
        // `updateSubscriptionPrice` mirar um id que não existe mais (bug de
        // 21/08/2026).
        planId: null,
        stripeSubscriptionId: null,
      },
    });
  }
}
