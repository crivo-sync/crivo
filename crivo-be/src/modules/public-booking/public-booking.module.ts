import { Module } from '@nestjs/common';

import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { BookOnlineUseCase } from './application/book-online.use-case';
import { PublicBookingController } from './infrastructure/http/public-booking.controller';

/**
 * Agendamento online: o paciente marca sozinho, sem login.
 *
 * Módulo separado de `appointments` porque a superfície é outra — rota
 * pública, sem tenant no token, e com resposta enxuta de propósito. A regra
 * de agenda, essa sim, é reusada de lá.
 */
@Module({
  imports: [PrismaModule, AppointmentsModule],
  controllers: [PublicBookingController],
  providers: [BookOnlineUseCase],
})
export class PublicBookingModule {}
