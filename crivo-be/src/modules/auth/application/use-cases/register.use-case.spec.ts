import { ConfigService } from '@nestjs/config';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { MailService } from 'src/modules/mail/application/mail.service';
import { RegisterUseCase } from './register.use-case';

/**
 * O plano escolhido no site vale como **teto durante o trial**, sem cobrar.
 *
 * Existe para fechar a causa raiz do excedente: o trial liberava até 8
 * profissionais, a clínica montava a equipe inteira, assinava o Solo (1) e
 * caía num estado que só se resolvia desativando gente **depois de pagar**.
 * Definindo o plano no cadastro, ela bate no limite no dia 1 do teste, quando
 * trocar de plano ainda é decisão barata.
 */
describe('RegisterUseCase — plano escolhido no cadastro', () => {
  function makeUseCase(planEncontrado: { id: string } | null) {
    const tenantCreate = jest
      .fn()
      .mockResolvedValue({ id: 'tenant-1', name: 'Clínica', subdomain: 'c' });

    const prisma = {
      tenant: { findUnique: jest.fn().mockResolvedValue(null) },
      user: { findUnique: jest.fn().mockResolvedValue(null) },
      plan: { findFirst: jest.fn().mockResolvedValue(planEncontrado) },
      $transaction: jest.fn().mockImplementation(async (fn: unknown) =>
        (fn as (tx: unknown) => Promise<unknown>)({
          tenant: { create: tenantCreate },
          user: {
            create: jest
              .fn()
              .mockResolvedValue({ id: 'user-1', email: 'a@b.com' }),
          },
        }),
      ),
    } as unknown as PrismaService;

    const mail = {
      send: jest.fn().mockResolvedValue(undefined),
    } as unknown as MailService;

    const config = {
      get: jest.fn().mockReturnValue('https://app.crivo.test'),
    } as unknown as ConfigService;

    return {
      useCase: new RegisterUseCase(prisma, mail, config),
      tenantCreate,
      prisma,
    };
  }

  const input = (planKey?: string) => ({
    tenantName: 'Clínica',
    subdomain: 'clinica',
    name: 'Admin',
    email: 'a@b.com',
    phone: '11987654321',
    password: 'senha12345',
    planKey,
  });

  it('grava o plano escolhido para o teto valer já no trial', async () => {
    const { useCase, tenantCreate } = makeUseCase({ id: 'plan-solo' });

    await useCase.execute(input('SOLO'));

    expect(tenantCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ planId: 'plan-solo' }),
      }),
    );
  });

  /**
   * Plano definido **não** é assinatura ativa: nada de Stripe, nada de
   * cobrança, e `TrialGuard` segue contando os 14 dias. Se isso vazasse
   * para `ACTIVE`, a clínica perderia o teste que foi prometido a ela.
   */
  it('não marca assinatura ativa nem toca em Stripe', async () => {
    const { useCase, tenantCreate } = makeUseCase({ id: 'plan-solo' });

    await useCase.execute(input('SOLO'));

    const data = tenantCreate.mock.calls[0][0].data as Record<string, unknown>;
    expect(data.subscriptionStatus).toBeUndefined();
    expect(data.stripeSubscriptionId).toBeUndefined();
    expect(data.trialEndsAt).toBeInstanceOf(Date);
  });

  it('cadastra sem plano quando a pessoa não escolheu nenhum', async () => {
    const { useCase, tenantCreate, prisma } = makeUseCase(null);

    await useCase.execute(input(undefined));

    // Sem `planKey` não faz sentido nem consultar o catálogo.
    expect(prisma.plan.findFirst).not.toHaveBeenCalled();
    const data = tenantCreate.mock.calls[0][0].data as Record<string, unknown>;
    expect(data.planId).toBeUndefined();
  });

  /**
   * Chave torta na URL não pode custar uma conta nova — é o pior desfecho
   * possível num fluxo de aquisição. Ignora o plano e segue.
   */
  it('ignora plano inexistente em vez de recusar o cadastro', async () => {
    const { useCase, tenantCreate } = makeUseCase(null);

    await useCase.execute(input('NAO_EXISTE'));

    expect(tenantCreate).toHaveBeenCalled();
    const data = tenantCreate.mock.calls[0][0].data as Record<string, unknown>;
    expect(data.planId).toBeUndefined();
  });
});
