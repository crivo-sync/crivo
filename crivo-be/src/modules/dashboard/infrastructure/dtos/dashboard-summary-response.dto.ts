import { ApiProperty } from '@nestjs/swagger';

import { AppointmentResponseDto } from 'src/modules/appointments/infrastructure/dtos/appointment-response.dto';
import { MessageResponseDto } from 'src/modules/messaging/infrastructure/dtos/message-response.dto';
import { AppointmentWithRelations } from 'src/modules/appointments/domain/repository/appointment.repository';
import { MessageWithPatient } from 'src/modules/messaging/domain/repository/message.repository';

class DashboardCountsDto {
  @ApiProperty()
  appointmentsToday!: number;

  @ApiProperty()
  upcomingUnconfirmed!: number;

  @ApiProperty()
  failedMessages!: number;

  @ApiProperty()
  patients!: number;

  @ApiProperty()
  activeProfessionals!: number;

  @ApiProperty()
  procedures!: number;
}

export class DashboardSummaryResponseDto {
  @ApiProperty({ type: [AppointmentResponseDto] })
  appointmentsToday!: AppointmentResponseDto[];

  @ApiProperty({
    type: [AppointmentResponseDto],
    description: 'Agendados (não confirmados) nas próximas 48h',
  })
  upcomingUnconfirmed!: AppointmentResponseDto[];

  @ApiProperty({ type: [MessageResponseDto] })
  failedMessages!: MessageResponseDto[];

  @ApiProperty({ type: DashboardCountsDto })
  counts!: DashboardCountsDto;

  static fromEntity(summary: {
    appointmentsToday: AppointmentWithRelations[];
    upcomingUnconfirmed: AppointmentWithRelations[];
    failedMessages: MessageWithPatient[];
    counts: DashboardCountsDto;
  }): DashboardSummaryResponseDto {
    return {
      appointmentsToday: summary.appointmentsToday.map(
        AppointmentResponseDto.fromEntity,
      ),
      upcomingUnconfirmed: summary.upcomingUnconfirmed.map(
        AppointmentResponseDto.fromEntity,
      ),
      failedMessages: summary.failedMessages.map(MessageResponseDto.fromEntity),
      counts: summary.counts,
    };
  }
}
