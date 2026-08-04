import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatus } from '@prisma/client';

class StatusCountDto {
  @ApiProperty({ enum: AppointmentStatus })
  status!: AppointmentStatus;

  @ApiProperty()
  count!: number;
}

class DayCountDto {
  @ApiProperty({ example: '2026-08-03' })
  date!: string;

  @ApiProperty()
  count!: number;
}

class ProcedureRevenueDto {
  @ApiProperty()
  name!: string;

  @ApiProperty({ description: 'Faturamento em centavos (só COMPLETED)' })
  totalInCents!: number;
}

export class DashboardAnalyticsResponseDto {
  @ApiProperty({ type: [StatusCountDto] })
  byStatus!: StatusCountDto[];

  @ApiProperty({
    type: [DayCountDto],
    description:
      'Agendamentos por dia, últimos 7 dias (todos os dias presentes, mesmo com count 0)',
  })
  byDay!: DayCountDto[];

  @ApiProperty({
    type: [ProcedureRevenueDto],
    description:
      'Faturamento por procedimento na janela de `revenueDays`, só agendamentos concluídos',
  })
  revenueByProcedure!: ProcedureRevenueDto[];

  @ApiProperty({
    example: 30,
    description:
      'Janela usada no faturamento, em dias — devolvida para a tela refletir o período aplicado',
  })
  revenueDays!: number;
}
