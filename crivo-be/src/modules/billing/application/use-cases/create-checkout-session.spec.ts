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
      findUniqueOrThrow: jest.fn().mockImplementation((args) =>
        args?.select?.plan
          ? Promise.resolve({ plan: currentPlan })
          : Promise.resolve(tenant),
      ),
      update: jest.fn().mockResolvedValue(tenant),
    },
    plan: { findUnique: jest.fn().mockResolvedValue(target) },
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

  it('com assinatura, NUNCA abre checkout novo — troca o preço da existente', async () => {
    const { useCase, stripe } = makeUseCase({
      target: INTERMEDIARIO,
      currentPlan: BASICO,
      stripeSubscriptionId: 'sub_1',
    });

    await useCase.execute({ tenantId: TENANT_ID, planId: INTERMEDIARIO.id });

    // Abrir checkout aqui criaria uma SEGUNDA assinatura ativa e o cliente
    // pagaria as duas — aconteceu de verdade (três simultâneas, R$ 727/mês).
    expect(stripe.createCheckoutSession).not.toHaveBeenCalled();
    expect(stripe.updateSubscriptionPrice).toHaveBeenCalled();
  });

  it('upgrade vale na hora e cobra a diferença', async () => {
    const { useCase, stripe, prisma } = makeUseCase({
      target: INTERMEDIARIO,
      currentPlan: BASICO,
      stripeSubscriptionId: 'sub_1',
    });

    const result = await useCase.execute({
      tenantId: TENANT_ID,
      planId: INTERMEDIARIO.id,
    });

    expect(stripe.updateSubscriptionPrice).toHaveBeenCalledWith(
      expect.objectContaining({ immediate: true }),
    );
    // Acesso liberado já: o plano novo é gravado na hora.
    expect(prisma.tenant.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { planId: INTERMEDIARIO.id } }),
    );
    expect(result).toMatchObject({ kind: 'changed' });
  });

  it('downgrade NÃO tira o acesso antes do fim do ciclo pago', async () => {
    const { useCase, stripe, prisma } = makeUseCase({
      target: BASICO,
      currentPlan: INTERMEDIARIO,
      stripeSubscriptionId: 'sub_1',
    });

    const result = await useCase.execute({
      tenantId: TENANT_ID,
      planId: BASICO.id,
    });

    // `immediate: false` = sem cobrança proporcional; a troca vale no fim do
    // ciclo. O cliente já pagou o mês do plano maior.
    expect(stripe.updateSubscriptionPrice).toHaveBeenCalledWith(
      expect.objectContaining({ immediate: false }),
    );
    // O plano no banco NÃO muda agora — quem grava é o webhook, quando o
    // ciclo virar. Rebaixar aqui tiraria recurso que já foi pago.
    expect(prisma.tenant.update).not.toHaveBeenCalled();
    expect(result).toMatchObject({ kind: 'changed' });
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
