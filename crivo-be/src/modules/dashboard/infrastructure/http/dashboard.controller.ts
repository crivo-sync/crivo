import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { Tenant } from 'src/shared/decorators/current-tenant.decorator';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { TenantContextGuard } from 'src/shared/tenant-context/tenant-context.guard';
import { GetDashboardSummaryUseCase } from '../../application/use-cases/get-dashboard-summary.use-case';
import { GetDashboardAnalyticsUseCase } from '../../application/use-cases/get-dashboard-analytics.use-case';
import { DashboardSummaryResponseDto } from '../dtos/dashboard-summary-response.dto';
import { DashboardAnalyticsResponseDto } from '../dtos/dashboard-analytics-response.dto';
import { QueryAnalyticsDto } from '../dtos/query-analytics.dto';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard, TenantContextGuard)
export class DashboardController {
  constructor(
    private readonly getDashboardSummary: GetDashboardSummaryUseCase,
    private readonly getDashboardAnalytics: GetDashboardAnalyticsUseCase,
  ) {}

  @Get('summary')
  @ApiOperation({
    summary:
      'Resumo da home do painel: agenda de hoje, a confirmar, mensagens que falharam e contadores gerais',
  })
  @ApiOkResponse({ type: DashboardSummaryResponseDto })
  async summary(@Tenant('tenantId') tenantId: string) {
    const result = await this.getDashboardSummary.execute(tenantId);

    return DashboardSummaryResponseDto.fromEntity(result);
  }

  @Get('analytics')
  @ApiOperation({
    summary:
      'Dados para gráficos: status e agendamentos por dia (últimos 7 dias) e ' +
      'faturamento por procedimento (janela configurável, 30 dias por padrão)',
  })
  @ApiOkResponse({ type: DashboardAnalyticsResponseDto })
  async analytics(
    @Tenant('tenantId') tenantId: string,
    @Query() query: QueryAnalyticsDto,
  ) {
    return this.getDashboardAnalytics.execute(tenantId, query.revenueDays);
  }
}
