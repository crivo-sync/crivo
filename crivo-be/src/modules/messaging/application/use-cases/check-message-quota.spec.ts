import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import {
  CheckMessageQuotaUseCase,
  TRIAL_MESSAGE_QUOTA,
} from './check-message-quota.use-case';

const TENANT_ID = 'tenant-1';

function makeUseCase(
  tenant: {
    subscriptionStatus: string;
    planId: string | null;
    plan: { maxMessagesPerMonth: number | null } | null;
  },
  sentThisMonth: number,
) {
  const prisma = {
    tenant: { findUniqueOrThrow: jest.fn().mockResolvedValue(tenant) },
    message: { count: jest.fn().mockResolvedValue(sentThisMonth) },
  } as unknown as PrismaService;

  return { useCase: new CheckMessageQuotaUseCase(prisma), prisma };
}

describe('CheckMessageQuotaUseCase', () => {
  it('libera plano sem teto sem nem contar as mensagens', async () => {
    const { useCase, prisma } = makeUseCase(
      {
        subscriptionStatus: 'ACTIVE',
        planId: 'plan-avancado',
        plan: { maxMessagesPerMonth: null },
      },
      999_999,
    );

    await expect(useCase.execute(TENANT_ID)).resolves.toEqual({
      allowed: true,
    });
    // Contar seria desperdício: o resultado não mudaria.
    expect(prisma.message.count).not.toHaveBeenCalled();
  });

  it('libera enquanto a clínica está abaixo do teto do plano', async () => {
    const { useCase } = makeUseCase(
      {
        subscriptionStatus: 'ACTIVE',
        planId: 'plan-solo',
        plan: { maxMessagesPerMonth: 500 },
      },
      499,
    );

    await expect(useCase.execute(TENANT_ID)).resolves.toEqual({
      allowed: true,
    });
  });

  it('bloqueia ao atingir o teto — o limite é inclusivo', async () => {
    const { useCase } = makeUseCase(
      {
        subscriptionStatus: 'ACTIVE',
        planId: 'plan-solo',
        plan: { maxMessagesPerMonth: 500 },
      },
      500,
    );

    await expect(useCase.execute(TENANT_ID)).resolves.toEqual({
      allowed: false,
      used: 500,
      limit: 500,
      isTrial: false,
    });
  });

  it('usa a franquia do trial quando não há plano', async () => {
    const { useCase } = makeUseCase(
      { subscriptionStatus: 'TRIALING', planId: null, plan: null },
      30,
    );

    await expect(useCase.execute(TENANT_ID)).resolves.toEqual({
      allowed: false,
      used: 30,
      limit: TRIAL_MESSAGE_QUOTA,
      isTrial: true,
    });
  });

  it('trial que escolheu plano no cadastro NÃO pula a franquia de 30', async () => {
    // Regressão do bug de 17/08/2026: `/cadastro?plano=X` gravava `planId`
    // mesmo em TRIALING. Antes, `isTrial = planId === null` tratava isso como
    // pago e a franquia virava a do plano (ex.: 500 no Solo) — custo real de
    // WhatsApp durante um teste que ainda não pagou nada. Trial é por STATUS.
    const { useCase } = makeUseCase(
      {
        subscriptionStatus: 'TRIALING',
        planId: 'plan-solo',
        plan: { maxMessagesPerMonth: 500 },
      },
      30,
    );

    await expect(useCase.execute(TENANT_ID)).resolves.toEqual({
      allowed: false,
      used: 30,
      limit: TRIAL_MESSAGE_QUOTA,
      isTrial: true,
    });
  });

  it('trial VENCIDO bloqueia o envio — mensagens na fila não saem', async () => {
    // Regressão de 21/08/2026: `EXPIRED` sem plano caía no `limit == null`
    // → `{ allowed: true }`, e mensagens que sobraram na fila seguiam saindo
    // (custo real de WhatsApp para uma conta que já fechou). `limit: 0` é o
    // sentinela de conta fechada.
    const { useCase } = makeUseCase(
      { subscriptionStatus: 'EXPIRED', planId: null, plan: null },
      12,
    );

    await expect(useCase.execute(TENANT_ID)).resolves.toEqual({
      allowed: false,
      used: 12,
      limit: 0,
      isTrial: false,
    });
  });

  it('assinatura CANCELADA bloqueia o envio do mesmo jeito', async () => {
    const { useCase } = makeUseCase(
      { subscriptionStatus: 'CANCELED', planId: null, plan: null },
      5,
    );

    await expect(useCase.execute(TENANT_ID)).resolves.toEqual({
      allowed: false,
      used: 5,
      limit: 0,
      isTrial: false,
    });
  });

  it('trial abaixo da franquia continua enviando', async () => {
    const { useCase } = makeUseCase(
      { subscriptionStatus: 'TRIALING', planId: null, plan: null },
      29,
    );

    await expect(useCase.execute(TENANT_ID)).resolves.toEqual({
      allowed: true,
    });
  });

  it('conta só o que já saiu, no mês corrente', async () => {
    const { useCase, prisma } = makeUseCase(
      {
        subscriptionStatus: 'ACTIVE',
        planId: 'plan-solo',
        plan: { maxMessagesPerMonth: 500 },
      },
      10,
    );

    await useCase.execute(TENANT_ID);

    // Mensagem na fila ainda pode ser cancelada por reagendamento, e falha
    // não gera custo — nenhuma das duas pode consumir franquia.
    const where = (prisma.message.count as jest.Mock).mock.calls[0][0].where;
    expect(where.status).toBe('SENT');
    expect(where.sentAt.gte).toBeInstanceOf(Date);
  });
});

describe('CheckMessageQuotaUseCase.usage', () => {
  it('devolve o número usado mesmo dentro do limite — diferente de `execute`', async () => {
    const { useCase } = makeUseCase(
      {
        subscriptionStatus: 'ACTIVE',
        planId: 'plan-solo',
        plan: { maxMessagesPerMonth: 500 },
      },
      120,
    );

    // `execute()` não devolveria `used`/`limit` aqui (retornaria só
    // `{ allowed: true }`) — é exatamente essa lacuna que `usage()` cobre.
    await expect(useCase.usage(TENANT_ID)).resolves.toEqual({
      used: 120,
      limit: 500,
      isTrial: false,
    });
  });

  it('plano sem teto devolve limit null, não Infinity nem omitido', async () => {
    const { useCase } = makeUseCase(
      {
        subscriptionStatus: 'ACTIVE',
        planId: 'plan-avancado',
        plan: { maxMessagesPerMonth: null },
      },
      9999,
    );

    await expect(useCase.usage(TENANT_ID)).resolves.toEqual({
      used: 9999,
      limit: null,
      isTrial: false,
    });
  });

  it('trial usa a franquia fixa, não o plano (que nem existe)', async () => {
    const { useCase } = makeUseCase(
      { subscriptionStatus: 'TRIALING', planId: null, plan: null },
      12,
    );

    await expect(useCase.usage(TENANT_ID)).resolves.toEqual({
      used: 12,
      limit: TRIAL_MESSAGE_QUOTA,
      isTrial: true,
    });
  });
});
