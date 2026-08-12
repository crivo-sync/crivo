import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { PrismaService } from '../infrastructure/prisma/prisma.service';
import {
  PLAN_FEATURE_KEY,
  type PlanFeature,
} from '../decorators/requires-plan-feature.decorator';

/**
 * Bloqueia uma rota quando o plano do tenant não inclui a feature exigida
 * por `@RequiresPlanFeature(...)`.
 *
 * Tenant sem `planId` (em trial) sempre passa — o trial libera o produto
 * inteiro. Só bloqueia quem já tem plano pago escolhido e esse plano não
 * inclui a feature.
 */
@Injectable()
export class PlanFeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const feature = this.reflector.getAllAndOverride<PlanFeature | undefined>(
      PLAN_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!feature) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const tenantId = req.tenantContext?.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('Tenant context not available.');
    }

    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      include: { plan: true },
    });

    if (!tenant.plan) return true;

    if (!tenant.plan[feature]) {
      throw new ForbiddenException(
        `O plano ${tenant.plan.name} não inclui este recurso. Faça upgrade em Configurações → Assinatura.`,
      );
    }

    return true;
  }
}
