import { Module } from '@nestjs/common';

import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { AssessAppointmentRiskUseCase } from './application/assess-appointment-risk.use-case';
import { PredictionController } from './infrastructure/http/prediction.controller';

/**
 * Risco de falta (no-show).
 *
 * Usa `PrismaService` direto, e não o `AppointmentRepository` como o
 * `dashboard` faz. O motivo é a consulta: o histórico por paciente é um
 * `groupBy(patientId, status)`, agregação que aquele repositório não expõe —
 * fazê-la por ele exigiria trazer todos os agendamentos e contar em memória,
 * ou acrescentar um método de agregação a uma interface que hoje é de
 * listagem. Quando um segundo consumidor precisar do mesmo histórico, aí o
 * método ganha dono e sobe para o repositório.
 */
@Module({
  imports: [PrismaModule],
  controllers: [PredictionController],
  providers: [AssessAppointmentRiskUseCase],
  exports: [AssessAppointmentRiskUseCase],
})
export class PredictionModule {}
