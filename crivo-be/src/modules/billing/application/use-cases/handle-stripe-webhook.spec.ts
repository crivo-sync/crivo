import { ConfigService } from '@nestjs/config';
import type Stripe from 'stripe';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { MailService } from 'src/modules/mail/application/mail.service';
import { StripeService } from '../../infrastructure/stripe/stripe.service';
import { HandleStripeWebhookUseCase } from './handle-stripe-webhook.use-case';

const TENANT_ID = 'tenant-1';

function makeUseCase({
  assinaturaAtualNoBanco,
}: {
  assinaturaAtualNoBanco: string | null;
}) {
  const prisma = {
    tenant: {
      findUnique: jest.fn().mockResolvedValue({
        id: TENANT_ID,
        name: 'Clínica Teste',
        stripeCustomerId: 'cus_1',
        stripeSubscriptionId: assinaturaAtualNoBanco,
        subscriptionStatus: 'ACTIVE',
        users: [{ email: 'admin@teste.com' }],
      }),
      update: jest.fn().mockResolvedValue({}),
    },
    plan: jest.fn(),
  } as unknown as PrismaService;

  // `plan.findUnique` é usado pelo e-mail de confirmação.
  (prisma as unknown as { plan: object }).plan = {
    findUnique: jest.fn().mockResolvedValue({
      name: 'Intermediário',
      priceInCents: 28900,
      maxMessagesPerMonth: 5000,
      maxProfessionals: null,
    }),
    findFirst: jest.fn().mockResolvedValue(null),
  };

  const stripe = {
    constructWebhookEvent: jest.fn(),
    retrieveSubscription: jest.fn().mockResolvedValue({ status: 'active' }),
    cancelSubscription: jest.fn().mockResolvedValue({}),
  } as unknown as StripeService;

  const mail = { send: jest.fn().mockResolvedValue(undefined) } as unknown as
    MailService;

  const config = {
    get: jest.fn().mockReturnValue('https://app.crivo.test'),
  } as unknown as ConfigService;

  return {
    useCase: new HandleStripeWebhookUseCase(prisma, stripe, mail, config),
    stripe,
    mail,
    prisma,
  };
}

/** Evento mínimo de checkout concluído. */
function checkoutEvent(subscriptionId: string): Stripe.Event {
  return {
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_1',
        subscription: subscriptionId,
        customer: 'cus_1',
        metadata: { tenantId: TENANT_ID, planId: 'plan-inter' },
      },
    },
  } as unknown as Stripe.Event;
}

describe('HandleStripeWebhookUseCase — troca de plano pelo checkout', () => {
  /**
   * O checkout do Stripe **sempre cria** uma assinatura nova; não substitui a
   * anterior. Sem cancelar, o cliente fica com duas ativas e paga as duas —
   * aconteceu de verdade (três simultâneas, R$ 727/mês).
   */
  it('cancela a assinatura anterior quando a nova confirma', async () => {
    const { useCase, stripe } = makeUseCase({
      assinaturaAtualNoBanco: 'sub_antiga',
    });

    (stripe.constructWebhookEvent as jest.Mock).mockReturnValue(
      checkoutEvent('sub_nova'),
    );

    await useCase.execute({
      rawBody: Buffer.from('{}'),
      signature: 'sig',
    });

    expect(stripe.cancelSubscription).toHaveBeenCalledWith('sub_antiga');
  });

  it('primeira assinatura não tenta cancelar nada', async () => {
    const { useCase, stripe } = makeUseCase({ assinaturaAtualNoBanco: null });

    (stripe.constructWebhookEvent as jest.Mock).mockReturnValue(
      checkoutEvent('sub_nova'),
    );

    await useCase.execute({ rawBody: Buffer.from('{}'), signature: 'sig' });

    expect(stripe.cancelSubscription).not.toHaveBeenCalled();
  });

  it('reprocessar o mesmo evento não cancela a assinatura vigente', async () => {
    const { useCase, stripe } = makeUseCase({
      assinaturaAtualNoBanco: 'sub_nova',
    });

    (stripe.constructWebhookEvent as jest.Mock).mockReturnValue(
      checkoutEvent('sub_nova'),
    );

    // O Stripe reentrega evento quando não recebe 200 a tempo. Cancelar aqui
    // mataria a assinatura que acabou de ser paga.
    await useCase.execute({ rawBody: Buffer.from('{}'), signature: 'sig' });

    expect(stripe.cancelSubscription).not.toHaveBeenCalled();
  });

  it('manda o e-mail de confirmação com o plano novo', async () => {
    const { useCase, stripe, mail } = makeUseCase({
      assinaturaAtualNoBanco: 'sub_antiga',
    });

    (stripe.constructWebhookEvent as jest.Mock).mockReturnValue(
      checkoutEvent('sub_nova'),
    );

    await useCase.execute({ rawBody: Buffer.from('{}'), signature: 'sig' });

    expect(mail.send).toHaveBeenCalledWith(
      'admin@teste.com',
      expect.objectContaining({
        subject: expect.stringContaining('Intermediário'),
      }),
    );
  });
});
