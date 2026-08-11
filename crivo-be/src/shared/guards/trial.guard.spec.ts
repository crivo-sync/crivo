import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';

import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { TrialGuard } from './trial.guard';

const TENANT_ID = 'tenant-1';

function makeContext(tenantId: string | undefined): ExecutionContext {
  const req = { tenantContext: tenantId ? { tenantId } : undefined };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

describe('TrialGuard', () => {
  it('libera quando o trial ainda não venceu', async () => {
    const prisma = {
      tenant: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          subscriptionStatus: 'TRIALING',
          trialEndsAt: new Date(Date.now() + 86_400_000), // amanhã
        }),
        update: jest.fn(),
      },
    } as unknown as PrismaService;

    const guard = new TrialGuard(prisma);

    await expect(guard.canActivate(makeContext(TENANT_ID))).resolves.toBe(true);
    expect(prisma.tenant.update).not.toHaveBeenCalled();
  });

  it('bloqueia e marca EXPIRED quando o trial venceu mas o status no banco ainda diz TRIALING', async () => {
    const prisma = {
      tenant: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          subscriptionStatus: 'TRIALING',
          trialEndsAt: new Date(Date.now() - 86_400_000), // ontem
        }),
        update: jest.fn().mockResolvedValue({}),
      },
    } as unknown as PrismaService;

    const guard = new TrialGuard(prisma);

    await expect(guard.canActivate(makeContext(TENANT_ID))).rejects.toThrow(
      ForbiddenException,
    );
    expect(prisma.tenant.update).toHaveBeenCalledWith({
      where: { id: TENANT_ID },
      data: { subscriptionStatus: 'EXPIRED' },
    });
  });

  it('bloqueia direto quando o status já está EXPIRED, sem consultar de novo o update', async () => {
    const prisma = {
      tenant: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          subscriptionStatus: 'EXPIRED',
          trialEndsAt: new Date(Date.now() - 86_400_000),
        }),
        update: jest.fn(),
      },
    } as unknown as PrismaService;

    const guard = new TrialGuard(prisma);

    await expect(guard.canActivate(makeContext(TENANT_ID))).rejects.toThrow(
      ForbiddenException,
    );
    expect(prisma.tenant.update).not.toHaveBeenCalled();
  });

  it('recusa quando não há tenantContext (guard aplicado sem TenantContextGuard antes)', async () => {
    const prisma = {
      tenant: { findUniqueOrThrow: jest.fn(), update: jest.fn() },
    } as unknown as PrismaService;

    const guard = new TrialGuard(prisma);

    await expect(guard.canActivate(makeContext(undefined))).rejects.toThrow(
      ForbiddenException,
    );
    expect(prisma.tenant.findUniqueOrThrow).not.toHaveBeenCalled();
  });
});
