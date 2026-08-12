import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';

import { PrismaService } from '../infrastructure/prisma/prisma.service';

const BLOCKED_MESSAGE =
  'O período de teste desta clínica acabou. Fale com o suporte para continuar.';

const CANCELED_MESSAGE =
  'A assinatura desta clínica foi cancelada. Fale com o suporte para reativar.';

/**
 * Bloqueia o painel quando o trial venceu, ou a assinatura foi cancelada.
 *
 * `PAST_DUE` (cartão recusado, Stripe tentando cobrar de novo) passa —
 * decisão deliberada de dar margem ao retry automático em vez de cortar
 * acesso por uma falha momentânea de cartão. Só `EXPIRED`/`CANCELED`
 * bloqueiam de fato.
 *
 * Não há cron marcando `EXPIRED`: a checagem acontece em request-time,
 * comparando `trialEndsAt` com agora. Quando vence, este guard também
 * grava `EXPIRED` no banco (lazily) — assim o status fica correto para
 * quem for consultá-lo depois (ex: tela de billing), sem depender de um
 * job rodando em background. Já `CANCELED` é gravado só pelo webhook do
 * Stripe (`customer.subscription.deleted`), nunca por este guard.
 *
 * Roda depois de `TenantContextGuard` na mesma lista de `@UseGuards` de
 * cada controller autenticado — precisa de `req.tenantContext` já
 * preenchido. Não é guard global porque guards globais rodam ANTES dos
 * guards de controller no Nest, e nesse ponto `tenantContext` ainda não
 * existiria.
 */
@Injectable()
export class TrialGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const tenantId = req.tenantContext?.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('Tenant context not available.');
    }

    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { subscriptionStatus: true, trialEndsAt: true },
    });

    if (tenant.subscriptionStatus === 'EXPIRED') {
      throw new ForbiddenException(BLOCKED_MESSAGE);
    }

    if (tenant.subscriptionStatus === 'CANCELED') {
      throw new ForbiddenException(CANCELED_MESSAGE);
    }

    if (
      tenant.subscriptionStatus === 'TRIALING' &&
      tenant.trialEndsAt.getTime() < Date.now()
    ) {
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { subscriptionStatus: 'EXPIRED' },
      });

      throw new ForbiddenException(BLOCKED_MESSAGE);
    }

    return true;
  }
}
