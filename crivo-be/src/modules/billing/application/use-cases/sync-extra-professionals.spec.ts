import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { StripeService } from '../../infrastructure/stripe/stripe.service';
import { SyncExtraProfessionalsUseCase } from './sync-extra-professionals.use-case';

const TENANT_ID = 'tenant-1';

function makeUseCase({
  tenant,
  activeCount,
}: {
  tenant: {
    stripeSubscriptionId: string | null;
    subscriptionStatus: string;
    plan: {
      maxProfessionals: number | null;
      stripeExtraProfessionalPriceId: string | null;
    } | null;
  } | null;
  activeCount: number;
}) {
  const prisma = {
    tenant: { findUnique: jest.fn().mockResolvedValue(tenant) },
    professional: { count: jest.fn().mockResolvedValue(activeCount) },
  } as unknown as PrismaService;

  const stripe = {
    setExtraProfessionalsQuantity: jest.fn().mockResolvedValue({}),
  } as unknown as StripeService;

  return { useCase: new SyncExtraProfessionalsUseCase(prisma, stripe), stripe };
}

describe('SyncExtraProfessionalsUseCase', () => {
  it('recalcula do zero: 5 profissionais num plano de 2 incluídos = 3 adicionais', async () => {
    const { useCase, stripe } = makeUseCase({
      tenant: {
        stripeSubscriptionId: 'sub_1',
        subscriptionStatus: 'ACTIVE',
        plan: {
          maxProfessionals: 2,
          stripeExtraProfessionalPriceId: 'price_extra',
        },
      },
      activeCount: 5,
    });

    await useCase.execute(TENANT_ID);

    expect(stripe.setExtraProfessionalsQuantity).toHaveBeenCalledWith({
      subscriptionId: 'sub_1',
      extraPriceId: 'price_extra',
      quantity: 3,
    });
  });

  it('dentro do limite: quantidade vai a zero, não fica negativa', async () => {
    const { useCase, stripe } = makeUseCase({
      tenant: {
        stripeSubscriptionId: 'sub_1',
        subscriptionStatus: 'ACTIVE',
        plan: {
          maxProfessionals: 4,
          stripeExtraProfessionalPriceId: 'price_extra',
        },
      },
      activeCount: 2,
    });

    await useCase.execute(TENANT_ID);

    expect(stripe.setExtraProfessionalsQuantity).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 0 }),
    );
  });

  it('trial (sem plano) não toca o Stripe', async () => {
    const { useCase, stripe } = makeUseCase({
      tenant: {
        stripeSubscriptionId: null,
        subscriptionStatus: 'TRIALING',
        plan: null,
      },
      activeCount: 10,
    });

    await useCase.execute(TENANT_ID);

    expect(stripe.setExtraProfessionalsQuantity).not.toHaveBeenCalled();
  });

  it('plano sem assinatura Stripe ainda (checkout nunca completou) não toca o Stripe', async () => {
    const { useCase, stripe } = makeUseCase({
      tenant: {
        stripeSubscriptionId: null,
        subscriptionStatus: 'TRIALING',
        plan: {
          maxProfessionals: 2,
          stripeExtraProfessionalPriceId: 'price_extra',
        },
      },
      activeCount: 5,
    });

    await useCase.execute(TENANT_ID);

    expect(stripe.setExtraProfessionalsQuantity).not.toHaveBeenCalled();
  });

  it('plano sem preço de adicional configurado (faixa de entrada) não toca o Stripe', async () => {
    const { useCase, stripe } = makeUseCase({
      tenant: {
        stripeSubscriptionId: 'sub_1',
        subscriptionStatus: 'ACTIVE',
        plan: { maxProfessionals: 1, stripeExtraProfessionalPriceId: null },
      },
      activeCount: 1,
    });

    await useCase.execute(TENANT_ID);

    expect(stripe.setExtraProfessionalsQuantity).not.toHaveBeenCalled();
  });

  it('plano sem teto (maxProfessionals null) não toca o Stripe', async () => {
    const { useCase, stripe } = makeUseCase({
      tenant: {
        stripeSubscriptionId: 'sub_1',
        subscriptionStatus: 'ACTIVE',
        plan: { maxProfessionals: null, stripeExtraProfessionalPriceId: null },
      },
      activeCount: 50,
    });

    await useCase.execute(TENANT_ID);

    expect(stripe.setExtraProfessionalsQuantity).not.toHaveBeenCalled();
  });

  it('falha no Stripe não lança — fica só logada para reparo manual', async () => {
    const { useCase, stripe } = makeUseCase({
      tenant: {
        stripeSubscriptionId: 'sub_1',
        subscriptionStatus: 'ACTIVE',
        plan: {
          maxProfessionals: 2,
          stripeExtraProfessionalPriceId: 'price_extra',
        },
      },
      activeCount: 3,
    });
    (stripe.setExtraProfessionalsQuantity as jest.Mock).mockRejectedValue(
      new Error('Stripe fora do ar'),
    );

    // Um cadastro de profissional já aconteceu no banco quando isto roda —
    // a sincronização de cobrança não pode derrubar o cadastro que já é real.
    await expect(useCase.execute(TENANT_ID)).resolves.toBeUndefined();
  });
});
