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
  ) {}

  @Get('plans')
  @ApiOperation({ summary: 'Planos ativos disponíveis para assinatura' })
  async listPlans() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceInCents: 'asc' },
    });
  }

  @Post('billing/checkout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantContextGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Abre o checkout do Stripe para um plano' })
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
