import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { StripeService } from '../../infrastructure/stripe/stripe.service';
import { CreateCheckoutSessionUseCase } from './create-checkout-session.use-case';

const TENANT_ID = 'tenant-1';

const BASICO = {
  id: 'plan-basico',
  name: 'Básico',
  priceInCents: 14900,
  stripePriceId: 'price_basico',
  isActive: true,
};
const INTERMEDIARIO = {
  id: 'plan-inter',
  name: 'Intermediário',
  priceInCents: 28900,
  stripePriceId: 'price_inter',
  isActive: true,
};

function makeUseCase({
  target,
  currentPlan,
  stripeSubscriptionId,
  subscriptionStatus,
}: {
  target: typeof BASICO;
  currentPlan: { id: string; name: string; priceInCents: number } | null;
  stripeSubscriptionId: string | null;
  subscriptionStatus: string;
}) {
  const tenant = {
    id: TENANT_ID,
    email: 'clinica@teste.com',
    subdomain: 'clinica',
    stripeCustomerId: 'cus_1',
    stripeSubscriptionId,
    subscriptionStatus,
    planId: currentPlan?.id ?? null,
  };

  const prisma = {
    tenant: {
      findUniqueOrThrow: jest.fn().mockResolvedValue(tenant),
      update: jest.fn().mockResolvedValue(tenant),
    },
    plan: {
      // Distingue o plano ALVO do plano ATUAL: o use case busca os dois, e um
      // mock que devolvesse sempre o mesmo esconderia o downgrade.
      findUnique: jest
        .fn()
        .mockImplementation((args) =>
          Promise.resolve(
            args?.where?.id === currentPlan?.id ? currentPlan : target,
          ),
        ),
    },
  } as unknown as PrismaService;

  const stripe = {
    retrieveCustomer: jest.fn().mockResolvedValue({ deleted: false }),
    updateSubscriptionPrice: jest.fn().mockResolvedValue({}),
    createCheckoutSession: jest
      .fn()
      .mockResolvedValue({ url: 'https://checkout.stripe.test/x' }),
  } as unknown as StripeService;

  const config = {
    getOrThrow: jest.fn().mockReturnValue('https://app.crivo.test'),
  } as unknown as ConfigService;

  return {
    useCase: new CreateCheckoutSessionUseCase(prisma, stripe, config),
    stripe,
    prisma,
  };
}

describe('CreateCheckoutSessionUseCase — troca de plano', () => {
  it('sem assinatura, abre o checkout', async () => {
    const { useCase, stripe } = makeUseCase({
      target: BASICO,
      currentPlan: null,
      stripeSubscriptionId: null,
      subscriptionStatus: 'TRIALING',
    });

    const result = await useCase.execute({
      tenantId: TENANT_ID,
      planId: BASICO.id,
    });

    expect(result).toEqual({
      kind: 'checkout',
      url: 'https://checkout.stripe.test/x',
    });
    expect(stripe.updateSubscriptionPrice).not.toHaveBeenCalled();
  });

  it('upgrade troca na mesma assinatura com proration — não abre checkout novo', async () => {
    const { useCase, stripe } = makeUseCase({
      target: INTERMEDIARIO,
      currentPlan: BASICO,
      stripeSubscriptionId: 'sub_1',
      subscriptionStatus: 'ACTIVE',
    });

    const result = await useCase.execute({
      tenantId: TENANT_ID,
      planId: INTERMEDIARIO.id,
    });

    // Subir de plano cobra a DIFERENÇA proporcional na hora, na assinatura
    // existente (`immediate: true` → `always_invoice`). Abrir checkout novo
    // cobraria o mês cheio do novo plano e cancelaria o antigo sem crédito —
    // o cliente pagaria o mês inteiro do novo + perderia o resto do já pago
    // (bug de 20/08/2026).
    expect(result).toMatchObject({ kind: 'changed' });
    expect(stripe.createCheckoutSession).not.toHaveBeenCalled();
    expect(stripe.updateSubscriptionPrice).toHaveBeenCalledWith(
      expect.objectContaining({ immediate: true }),
    );
  });

  it('downgrade NÃO passa pelo checkout nem cobra de novo', async () => {
    const { useCase, stripe, prisma } = makeUseCase({
      target: BASICO,
      currentPlan: INTERMEDIARIO,
      stripeSubscriptionId: 'sub_1',
      subscriptionStatus: 'ACTIVE',
    });

    const result = await useCase.execute({
      tenantId: TENANT_ID,
      planId: BASICO.id,
    });

    // Cobrar para descer de plano seria absurdo: o mês do plano maior já
    // foi pago.
    expect(stripe.createCheckoutSession).not.toHaveBeenCalled();
    expect(stripe.updateSubscriptionPrice).toHaveBeenCalledWith(
      expect.objectContaining({ immediate: false }),
    );
    // O plano no banco NÃO muda agora — quem grava é o webhook, quando o
    // ciclo virar. Rebaixar aqui tiraria recurso que já foi pago.
    expect(prisma.tenant.update).not.toHaveBeenCalled();
    expect((result as { message: string }).message).toMatch(/até o fim/i);
  });

  it('recusa assinar o plano que já está contratado', async () => {
    const { useCase } = makeUseCase({
      target: BASICO,
      currentPlan: BASICO,
      stripeSubscriptionId: 'sub_1',
      subscriptionStatus: 'ACTIVE',
    });

    await expect(
      useCase.execute({ tenantId: TENANT_ID, planId: BASICO.id }),
    ).rejects.toThrow(BadRequestException);
  });

  it('assinatura CANCELADA pode reassinar o próprio plano', async () => {
    // Regressão do bug de 21/08/2026: cancelar nunca limpava `planId`, então
    // o "Este já é o plano contratado." travava a reassinatura — o cliente
    // ficava sem plano e sem jeito de voltar por conta própria.
    const { useCase, stripe } = makeUseCase({
      target: BASICO,
      currentPlan: BASICO,
      stripeSubscriptionId: null,
      subscriptionStatus: 'CANCELED',
    });

    const result = await useCase.execute({
      tenantId: TENANT_ID,
      planId: BASICO.id,
    });

    expect(result).toEqual({
      kind: 'checkout',
      url: 'https://checkout.stripe.test/x',
    });
    expect(stripe.updateSubscriptionPrice).not.toHaveBeenCalled();
  });

  it('assinatura CANCELADA com subscriptionId velho NÃO tenta trocar preço', async () => {
    // Defesa extra: mesmo se o `stripeSubscriptionId` ficar preso no banco
    // (webhook de delete perdido), o status CANCELED manda para o checkout
    // novo em vez de chamar `updateSubscriptionPrice` num id morto.
    const { useCase, stripe } = makeUseCase({
      target: BASICO,
      currentPlan: BASICO,
      stripeSubscriptionId: 'sub_cancelada',
      subscriptionStatus: 'CANCELED',
    });

    const result = await useCase.execute({
      tenantId: TENANT_ID,
      planId: BASICO.id,
    });

    expect(result).toEqual({
      kind: 'checkout',
      url: 'https://checkout.stripe.test/x',
    });
    expect(stripe.updateSubscriptionPrice).not.toHaveBeenCalled();
  });
});
