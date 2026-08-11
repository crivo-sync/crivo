import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

import { Tenant } from 'src/shared/decorators/current-tenant.decorator';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { TenantContextGuard } from 'src/shared/tenant-context/tenant-context.guard';
import { TrialGuard } from 'src/shared/guards/trial.guard';
import { AssessAppointmentRiskUseCase } from '../../application/assess-appointment-risk.use-case';
import { MeasureRuleAccuracyUseCase } from '../../application/measure-rule-accuracy.use-case';

export class QueryUpcomingRiskDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  days: number = 7;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit: number = 50;
}

/**
 * Risco de falta.
 *
 * Sem `@Roles`: agir sobre o risco (ligar, reconfirmar) é trabalho da
 * recepção — restringir a ADMIN esvaziaria a função.
 */
@ApiTags('Predição')
@ApiBearerAuth()
@Controller('prediction')
@UseGuards(JwtAuthGuard, TenantContextGuard, TrialGuard)
export class PredictionController {
  constructor(
    private readonly assessRisk: AssessAppointmentRiskUseCase,
    private readonly measureAccuracy: MeasureRuleAccuracyUseCase,
  ) {}

  @Get('no-show/accuracy')
  @ApiOperation({
    summary:
      'Compara o risco previsto com o que aconteceu — diz se os pesos estão certos',
  })
  async accuracy(
    @Tenant('tenantId') tenantId: string,
    @Query('days') days?: string,
  ) {
    return this.measureAccuracy.execute(tenantId, Number(days) || 180);
  }

  @Get('no-show/upcoming')
  @ApiOperation({
    summary: 'Agenda futura ordenada por risco de falta (maior primeiro)',
  })
  async upcoming(
    @Tenant('tenantId') tenantId: string,
    @Query() query: QueryUpcomingRiskDto,
  ) {
    const data = await this.assessRisk.forUpcoming(tenantId, {
      days: query.days,
      limit: query.limit,
    });

    return {
      data,
      // Contagem por faixa: a recepção decide o esforço do dia por aqui,
      // antes de olhar a lista item a item.
      summary: {
        high: data.filter((item) => item.level === 'HIGH').length,
        medium: data.filter((item) => item.level === 'MEDIUM').length,
        low: data.filter((item) => item.level === 'LOW').length,
      },
    };
  }

  @Get('no-show/:appointmentId')
  @ApiOperation({ summary: 'Risco de falta de um agendamento' })
  async forAppointment(
    @Tenant('tenantId') tenantId: string,
    @Param('appointmentId') appointmentId: string,
  ) {
    return this.assessRisk.forAppointment(appointmentId, tenantId);
  }
}
