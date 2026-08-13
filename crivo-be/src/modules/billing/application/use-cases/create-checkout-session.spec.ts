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
}: {
  target: typeof BASICO;
  currentPlan: { id: string; name: string; priceInCents: number } | null;
  stripeSubscriptionId: string | null;
}) {
  const tenant = {
    id: TENANT_ID,
    email: 'clinica@teste.com',
    subdomain: 'clinica',
    stripeCustomerId: 'cus_1',
    stripeSubscriptionId,
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
      findUnique: jest.fn().mockImplementation((args) =>
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

  it('upgrade vai para o checkout — o cliente confirma o pagamento', async () => {
    const { useCase, stripe } = makeUseCase({
      target: INTERMEDIARIO,
      currentPlan: BASICO,
      stripeSubscriptionId: 'sub_1',
    });

    const result = await useCase.execute({
      tenantId: TENANT_ID,
      planId: INTERMEDIARIO.id,
    });

    // Subir de plano cobra: passa pela tela do Stripe, e é o
    // `checkout.session.completed` que dispara o e-mail de confirmação.
    expect(result).toMatchObject({ kind: 'checkout' });
    expect(stripe.createCheckoutSession).toHaveBeenCalled();
    // A assinatura antiga é cancelada pelo WEBHOOK, não aqui — só depois de
    // o pagamento novo confirmar.
    expect(stripe.updateSubscriptionPrice).not.toHaveBeenCalled();
  });

  it('downgrade NÃO passa pelo checkout nem cobra de novo', async () => {
    const { useCase, stripe, prisma } = makeUseCase({
      target: BASICO,
      currentPlan: INTERMEDIARIO,
      stripeSubscriptionId: 'sub_1',
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
    });

    await expect(
      useCase.execute({ tenantId: TENANT_ID, planId: BASICO.id }),
    ).rejects.toThrow(BadRequestException);
  });
});
