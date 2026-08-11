import { Module } from '@nestjs/common';

import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { MessagingModule } from '../messaging/messaging.module';
import { AppointmentController } from './infrastructure/http/appointment.controller';
import { PrismaAppointmentRepository } from './infrastructure/prisma/prisma-appointment.repository';
import { APPOINTMENT_REPOSITORY } from './domain/repository/appointment.repository';
import { GetAppointmentsUseCase } from './application/use-cases/get-appointments.use-case';
import { GetAppointmentByIdUseCase } from './application/use-cases/get-appointment-by-id.use-case';
import { CreateAppointmentUseCase } from './application/use-cases/create-appointment.use-case';
import { RescheduleAppointmentUseCase } from './application/use-cases/reschedule-appointment.use-case';
import { ChangeAppointmentStatusUseCase } from './application/use-cases/change-appointment-status.use-case';
import { BusinessHoursService } from './application/services/business-hours.service';
import { ProfessionalAvailabilityService } from './application/services/professional-availability.service';
import { GetAvailabilityUseCase } from './application/use-cases/get-availability.use-case';
import { GuardsModule } from '../../shared/guards/guards.module';

@Module({
  imports: [PrismaModule, MessagingModule, GuardsModule],
  controllers: [AppointmentController],
  providers: [
    {
      provide: APPOINTMENT_REPOSITORY,
      useClass: PrismaAppointmentRepository,
    },
    GetAppointmentsUseCase,
    GetAppointmentByIdUseCase,
    CreateAppointmentUseCase,
    RescheduleAppointmentUseCase,
    ChangeAppointmentStatusUseCase,
    BusinessHoursService,
    ProfessionalAvailabilityService,
    GetAvailabilityUseCase,
  ],
  // `CreateAppointmentUseCase` e `GetAvailabilityUseCase` são exportados para
  // o agendamento online reusar as MESMAS regras de agenda do painel — uma
  // segunda implementação na rota pública divergiria da primeira.
  exports: [
    APPOINTMENT_REPOSITORY,
    CreateAppointmentUseCase,
    GetAvailabilityUseCase,
  ],
})
export class AppointmentsModule {}
