import { Module } from '@nestjs/common';

import { AppointmentsModule } from '../appointments/appointments.module';
import { PatientsModule } from '../patients/patients.module';
import { ProfessionalsModule } from '../professionals/professionals.module';
import { ProceduresModule } from '../procedures/procedures.module';
import { MessagingModule } from '../messaging/messaging.module';
import { DashboardController } from './infrastructure/http/dashboard.controller';
import { GetDashboardSummaryUseCase } from './application/use-cases/get-dashboard-summary.use-case';
import { GetDashboardAnalyticsUseCase } from './application/use-cases/get-dashboard-analytics.use-case';

/**
 * Não tem repository/Prisma próprio — só agrega dados que já existem em
 * outros módulos (cada um continua dono da sua tabela e das suas regras).
 * Por isso importa os módulos de origem em vez de reimplementar acesso a
 * dados aqui; cada um já exporta seu token de repositório para isso.
 */
@Module({
  imports: [
    AppointmentsModule,
    PatientsModule,
    ProfessionalsModule,
    ProceduresModule,
    MessagingModule,
  ],
  controllers: [DashboardController],
  providers: [GetDashboardSummaryUseCase, GetDashboardAnalyticsUseCase],
})
export class DashboardModule {}
