import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { ExpireTrialsUseCase } from './expire-trials.use-case';

describe('ExpireTrialsUseCase', () => {
  function makeUseCase(count: number) {
    const prisma = {
      tenant: { updateMany: jest.fn().mockResolvedValue({ count }) },
    } as unknown as PrismaService;

    return { useCase: new ExpireTrialsUseCase(prisma), prisma };
  }

  it('marca como EXPIRED só quem está em trial e já venceu', async () => {
    const { useCase, prisma } = makeUseCase(3);

    await expect(useCase.execute()).resolves.toEqual({ expired: 3 });

    const call = (prisma.tenant.updateMany as jest.Mock).mock.calls[0][0];
    expect(call.where.subscriptionStatus).toBe('TRIALING');
    expect(call.where.trialEndsAt.lt).toBeInstanceOf(Date);
    expect(call.data).toEqual({ subscriptionStatus: 'EXPIRED' });
  });

  it('não mexe em quem já está pagando', async () => {
    const { useCase, prisma } = makeUseCase(0);

    await useCase.execute();

    // O filtro por `TRIALING` é o que protege `ACTIVE`/`PAST_DUE` — sem
    // ele, o cron desligaria clínica que paga em dia.
    const where = (prisma.tenant.updateMany as jest.Mock).mock.calls[0][0]
      .where;
    expect(where.subscriptionStatus).toBe('TRIALING');
  });

  it('é idempotente: sem trial vencido, não altera nada', async () => {
    const { useCase } = makeUseCase(0);

    await expect(useCase.execute()).resolves.toEqual({ expired: 0 });
  });
});
