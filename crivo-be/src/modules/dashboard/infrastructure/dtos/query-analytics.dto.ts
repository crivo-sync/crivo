import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional } from 'class-validator';

/** Períodos oferecidos na tela — lista fechada para não virar query aberta. */
export const REVENUE_PERIOD_DAYS = [7, 30, 90] as const;

export class QueryAnalyticsDto {
  @ApiPropertyOptional({
    enum: REVENUE_PERIOD_DAYS,
    default: 30,
    description:
      'Janela do faturamento por procedimento, em dias. Separada dos demais ' +
      'gráficos (que seguem em 7 dias) porque clínica com movimento baixo não ' +
      'fecha procedimento todo dia — em 7 dias o gráfico vem vazio.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn(REVENUE_PERIOD_DAYS)
  revenueDays?: number;
}
