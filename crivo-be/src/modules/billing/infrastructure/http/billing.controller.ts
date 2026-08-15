import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { Tenant } from 'src/shared/decorators/current-tenant.decorator';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { TenantContextGuard } from 'src/shared/tenant-context/tenant-context.guard';
import { Role } from '@prisma/client';
import { CreateCheckoutSessionUseCase } from '../../application/use-cases/create-checkout-session.use-case';
import { CheckMessageQuotaUseCase } from '../../../messaging/application/use-cases/check-message-quota.use-case';

export class CreateCheckoutSessionDto {
  @IsString()
  planId!: string;
}

@ApiTags('Planos e assinatura')
@Controller()
export class BillingController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly createCheckoutSession: CreateCheckoutSessionUseCase,
    private readonly checkMessageQuota: CheckMessageQuotaUseCase,
  ) {}

  @Get('plans')
  @ApiOperation({ summary: 'Planos ativos disponíveis para assinatura' })
  async listPlans() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceInCents: 'asc' },
    });
  }

  @Get('billing/usage')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiOperation({
    summary: 'Mensagens usadas no mês corrente e o limite do plano',
  })
  // Sem `TrialGuard` de propósito: é a mesma exceção de `GET /tenants/me` —
  // clínica com trial vencido precisa continuar vendo o próprio consumo
  // para entender o motivo do bloqueio, não ficar sem informação nenhuma.
  async messageUsage(@Tenant('tenantId') tenantId: string) {
    return this.checkMessageQuota.usage(tenantId);
  }

  @Post('billing/checkout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantContextGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary:
      'Assina um plano. Sem assinatura, devolve a URL do checkout; com ' +
      'assinatura existente, troca o preço dela (upgrade na hora, downgrade ' +
      'no fim do ciclo já pago)',
  })
  async checkout(
    @Tenant('tenantId') tenantId: string,
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    return this.createCheckoutSession.execute({
      tenantId,
      planId: dto.planId,
    });
  }
}
