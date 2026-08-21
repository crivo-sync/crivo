import { ConfigService } from '@nestjs/config';
import type Stripe from 'stripe';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { MailService } from 'src/modules/mail/application/mail.service';
import { StripeService } from '../../infrastructure/stripe/stripe.service';
import { HandleStripeWebhookUseCase } from './handle-stripe-webhook.use-case';

const TENANT_ID = 'tenant-1';

function makeUseCase({
  assinaturaAtualNoBanco,
  hasAiMessages = true,
  maxProfessionals = null,
  profissionaisAtivos = 0,
  planDoPreco = null,
  planIdAtual = 'plan-inter',
}: {
  assinaturaAtualNoBanco: string | null;
  /** Plano do checkout inclui IA? Default `true` — não afeta os testes que não são sobre isso. */
  hasAiMessages?: boolean;
  /** Teto do plano contratado. `null` (default) = sem limite. */
  maxProfessionals?: number | null;
  /** Quantos profissionais ativos a clínica já tem quando o plano confirma. */
  profissionaisAtivos?: number;
  /**
   * Plano resolvido a partir do `stripePriceId` da assinatura, em
   * `customer.subscription.updated`. Preencher = simula troca de plano
   * (o caminho do downgrade agendado).
   */
  planDoPreco?: {
    id: string;
    name: string;
    maxProfessionals: number | null;
  } | null;
  /** Plano que o tenant tem **antes** do evento. */
  planIdAtual?: string;
}) {
  const prisma = {
    tenant: {
      findUnique: jest.fn().mockResolvedValue({
        id: TENANT_ID,
        name: 'Clínica Teste',
        stripeCustomerId: 'cus_1',
        stripeSubscriptionId: assinaturaAtualNoBanco,
        subscriptionStatus: 'ACTIVE',
        planId: planIdAtual,
        users: [{ email: 'admin@teste.com' }],
      }),
      update: jest.fn().mockResolvedValue({}),
    },
    professional: {
      count: jest.fn().mockResolvedValue(profissionaisAtivos),
    },
    plan: jest.fn(),
  } as unknown as PrismaService;

  // `plan.findUnique` é usado para checar `hasAiMessages` do plano novo,
  // montar o e-mail de confirmação e checar o teto de profissionais —
  // mesmo plano nos três.
  (prisma as unknown as { plan: object }).plan = {
    findUnique: jest.fn().mockResolvedValue({
      name: 'Intermediário',
      priceInCents: 28900,
      maxMessagesPerMonth: 5000,
      maxProfessionals,
      hasAiMessages,
    }),
    // `findFirst` resolve o plano pelo `stripePriceId` em
    // `customer.subscription.updated` — é por aqui que o **downgrade
    // agendado** efetiva. `null` (default) = evento sem troca de plano.
    findFirst: jest.fn().mockResolvedValue(planDoPreco),
  };

  const stripe = {
    constructWebhookEvent: jest.fn(),
    retrieveSubscription: jest.fn().mockResolvedValue({ status: 'active' }),
    cancelSubscription: jest.fn().mockResolvedValue({}),
  } as unknown as StripeService;

  const mail = {
    send: jest.fn().mockResolvedValue(undefined),
  } as unknown as MailService;

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

  /**
   * O caso que o trial cria: a clínica testa com a equipe inteira e assina
   * um plano que comporta menos gente. Ninguém é desativado aqui — o e-mail
   * avisa e a escolha de quem fica é da clínica
   * (`ResolveOverLimitUseCase`). Antes disso, o webhook cobrava o excedente
   * como "profissional adicional", que é justamente o comportamento
   * revertido em 17/08 por remover o teto do plano na prática.
   */
  it('avisa por e-mail quando a equipe não cabe no plano assinado', async () => {
    const { useCase, stripe, mail } = makeUseCase({
      assinaturaAtualNoBanco: null,
      maxProfessionals: 1,
      profissionaisAtivos: 3,
    });

    (stripe.constructWebhookEvent as jest.Mock).mockReturnValue(
      checkoutEvent('sub_nova'),
    );

    await useCase.execute({ rawBody: Buffer.from('{}'), signature: 'sig' });

    expect(mail.send).toHaveBeenCalledWith(
      'admin@teste.com',
      expect.objectContaining({
        subject: expect.stringContaining('acima do limite'),
      }),
    );
  });

  it('não avisa de excedente quando a equipe cabe no plano', async () => {
    const { useCase, stripe, mail } = makeUseCase({
      assinaturaAtualNoBanco: null,
      maxProfessionals: 4,
      profissionaisAtivos: 3,
    });

    (stripe.constructWebhookEvent as jest.Mock).mockReturnValue(
      checkoutEvent('sub_nova'),
    );

    await useCase.execute({ rawBody: Buffer.from('{}'), signature: 'sig' });

    expect(mail.send).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        subject: expect.stringContaining('acima do limite'),
      }),
    );
  });

  /** Cabe exato no teto não é excedente — 2 de 2 está dentro do plano. */
  it('não avisa quando a equipe cabe exatamente no teto', async () => {
    const { useCase, stripe, mail } = makeUseCase({
      assinaturaAtualNoBanco: null,
      maxProfessionals: 2,
      profissionaisAtivos: 2,
    });

    (stripe.constructWebhookEvent as jest.Mock).mockReturnValue(
      checkoutEvent('sub_nova'),
    );

    await useCase.execute({ rawBody: Buffer.from('{}'), signature: 'sig' });

    expect(mail.send).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        subject: expect.stringContaining('acima do limite'),
      }),
    );
  });

  /**
   * Achado em 17/08/2026: uma clínica ligou `aiMessagesEnabled` em trial
   * (que libera tudo) e depois assinou um plano sem IA. O envio já
   * respeitava `plan.hasAiMessages` — não gastava DeepSeek à toa — mas o
   * toggle continuava marcado "ligado" na tela, porque nada o desligava
   * quando o plano mudava.
   */
  it('desliga a IA se o plano contratado não a inclui', async () => {
    const { useCase, stripe, prisma } = makeUseCase({
      assinaturaAtualNoBanco: null,
      hasAiMessages: false,
    });

    (stripe.constructWebhookEvent as jest.Mock).mockReturnValue(
      checkoutEvent('sub_nova'),
    );

    await useCase.execute({ rawBody: Buffer.from('{}'), signature: 'sig' });

    expect(prisma.tenant.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ aiMessagesEnabled: false }),
      }),
    );
  });

  it('não mexe no toggle quando o plano contratado inclui IA', async () => {
    const { useCase, stripe, prisma } = makeUseCase({
      assinaturaAtualNoBanco: null,
      hasAiMessages: true,
    });

    (stripe.constructWebhookEvent as jest.Mock).mockReturnValue(
      checkoutEvent('sub_nova'),
    );

    await useCase.execute({ rawBody: Buffer.from('{}'), signature: 'sig' });

    // Não força `true`: se a clínica tinha desligado por escolha própria,
    // o upgrade de plano não deveria religar sozinho.
    const [[call]] = (prisma.tenant.update as jest.Mock).mock.calls;
    expect(call.data).not.toHaveProperty('aiMessagesEnabled');
  });
});

/**
 * `customer.subscription.updated` é por onde o **downgrade agendado**
 * efetiva: a clínica pediu a troca semanas antes e o ciclo virou agora.
 * É o caminho que cria excedente **sem ela agir naquele momento** — a
 * equipe que cabia no plano antigo não cabe no novo.
 */
describe('HandleStripeWebhookUseCase — downgrade agendado', () => {
  function subscriptionUpdatedEvent(): Stripe.Event {
    return {
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_atual',
          status: 'active',
          items: { data: [{ price: { id: 'price_solo' } }] },
        },
      },
    } as unknown as Stripe.Event;
  }

  it('avisa quando o downgrade deixa a equipe acima do teto', async () => {
    const { useCase, stripe, mail } = makeUseCase({
      assinaturaAtualNoBanco: 'sub_atual',
      planIdAtual: 'plan-profissional',
      planDoPreco: { id: 'plan-solo', name: 'Solo', maxProfessionals: 1 },
      maxProfessionals: 1,
      profissionaisAtivos: 4,
    });

    (stripe.constructWebhookEvent as jest.Mock).mockReturnValue(
      subscriptionUpdatedEvent(),
    );

    await useCase.execute({ rawBody: Buffer.from('{}'), signature: 'sig' });

    expect(mail.send).toHaveBeenCalledWith(
      'admin@teste.com',
      expect.objectContaining({
        subject: expect.stringContaining('acima do limite'),
      }),
    );
  });

  it('não avisa de excedente quando a equipe cabe no plano novo', async () => {
    const { useCase, stripe, mail } = makeUseCase({
      assinaturaAtualNoBanco: 'sub_atual',
      planIdAtual: 'plan-profissional',
      planDoPreco: { id: 'plan-solo', name: 'Solo', maxProfessionals: 4 },
      maxProfessionals: 4,
      profissionaisAtivos: 2,
    });

    (stripe.constructWebhookEvent as jest.Mock).mockReturnValue(
      subscriptionUpdatedEvent(),
    );

    await useCase.execute({ rawBody: Buffer.from('{}'), signature: 'sig' });

    expect(mail.send).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        subject: expect.stringContaining('acima do limite'),
      }),
    );
  });

  /**
   * Regressão de 20/08/2026: o plano era resolvido por `items.data[0]`. Com
   * o item de profissional adicional na assinatura (2+ itens), a posição 0
   * podia ser o adicional — cujo preço não bate com plano nenhum — e o
   * `planId` do tenant nunca atualizava, mesmo com a cobrança já mudando.
   */
  it('resolve o plano pelo preço entre TODOS os itens, não pelo primeiro', async () => {
    const { useCase, stripe, prisma } = makeUseCase({
      assinaturaAtualNoBanco: 'sub_atual',
      planIdAtual: 'plan-solo',
      planDoPreco: {
        id: 'plan-profissional',
        name: 'Profissional',
        maxProfessionals: 4,
      },
    });

    (stripe.constructWebhookEvent as jest.Mock).mockReturnValue({
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_atual',
          status: 'active',
          // Profissional adicional na posição 0 — se o código lesse
          // `items.data[0]`, `price_prof_extra` não bateria com plano
          // nenhum e o `planId` não seria atualizado.
          items: {
            data: [
              { price: { id: 'price_prof_extra' } },
              { price: { id: 'price_profissional' } },
            ],
          },
        },
      },
    } as unknown as Stripe.Event);

    await useCase.execute({ rawBody: Buffer.from('{}'), signature: 'sig' });

    // O `findFirst` recebe TODOS os preços da assinatura no filtro `in`,
    // não só o primeiro item.
    expect(prisma.plan.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          stripePriceId: { in: ['price_prof_extra', 'price_profissional'] },
        },
      }),
    );
    // E o tenant é atualizado para o plano resolvido (Profissional).
    expect(prisma.tenant.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ planId: 'plan-profissional' }),
      }),
    );
  });
});

describe('HandleStripeWebhookUseCase — assinatura cancelada', () => {
  /**
   * Regressão de 21/08/2026: `customer.subscription.deleted` só marcava
   * `CANCELED` e deixava `planId`/`stripeSubscriptionId` presos no banco.
   * Consequência: o "Este já é o plano contratado." do checkout impedia a
   * clínica de REASSINAR o próprio plano — ela ficava sem assinatura e sem
   * jeito de voltar por conta própria.
   */
  it('limpa plano e assinatura para permitir reassinatura', async () => {
    const { useCase, stripe, prisma } = makeUseCase({
      assinaturaAtualNoBanco: 'sub_atual',
      planIdAtual: 'plan-inter',
    });

    (stripe.constructWebhookEvent as jest.Mock).mockReturnValue({
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_atual' } },
    } as unknown as Stripe.Event);

    await useCase.execute({
      rawBody: Buffer.from('{}'),
      signature: 'sig',
    });

    expect(prisma.tenant.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subscriptionStatus: 'CANCELED',
          planId: null,
          stripeSubscriptionId: null,
        }),
      }),
    );
  });
});
