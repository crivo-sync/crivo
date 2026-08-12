import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';

import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { PlanFeatureGuard } from './plan-feature.guard';

const TENANT_ID = 'tenant-1';

function makeContext(tenantId: string | undefined): ExecutionContext {
  const req = { tenantContext: tenantId ? { tenantId } : undefined };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

function makeReflector(feature: string | undefined) {
  return {
    getAllAndOverride: jest.fn().mockReturnValue(feature),
  } as unknown as Reflector;
}

describe('PlanFeatureGuard', () => {
  it('libera direto quando a rota não exige nenhuma feature', async () => {
    const prisma = {
      tenant: { findUniqueOrThrow: jest.fn() },
    } as unknown as PrismaService;

    const guard = new PlanFeatureGuard(makeReflector(undefined), prisma);

    await expect(guard.canActivate(makeContext(TENANT_ID))).resolves.toBe(true);
    expect(prisma.tenant.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it('libera tenant em trial (sem plano), mesmo exigindo a feature', async () => {
    const prisma = {
      tenant: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({ plan: null }),
      },
    } as unknown as PrismaService;

    const guard = new PlanFeatureGuard(makeReflector('hasPrediction'), prisma);

    await expect(guard.canActivate(makeContext(TENANT_ID))).resolves.toBe(true);
  });

  it('libera quando o plano inclui a feature', async () => {
    const prisma = {
      tenant: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          plan: { hasPrediction: true, name: 'Intermediário' },
        }),
      },
    } as unknown as PrismaService;

    const guard = new PlanFeatureGuard(makeReflector('hasPrediction'), prisma);

    await expect(guard.canActivate(makeContext(TENANT_ID))).resolves.toBe(true);
  });

  it('bloqueia quando o plano não inclui a feature', async () => {
    const prisma = {
      tenant: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          plan: { hasPrediction: false, name: 'Básico' },
        }),
      },
    } as unknown as PrismaService;

    const guard = new PlanFeatureGuard(makeReflector('hasPrediction'), prisma);

    await expect(guard.canActivate(makeContext(TENANT_ID))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('recusa quando não há tenantContext', async () => {
    const prisma = {
      tenant: { findUniqueOrThrow: jest.fn() },
    } as unknown as PrismaService;

    const guard = new PlanFeatureGuard(makeReflector('hasPrediction'), prisma);

    await expect(guard.canActivate(makeContext(undefined))).rejects.toThrow(
      ForbiddenException,
    );
    expect(prisma.tenant.findUniqueOrThrow).not.toHaveBeenCalled();
  });
});
