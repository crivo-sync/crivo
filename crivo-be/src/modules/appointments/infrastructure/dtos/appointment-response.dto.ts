import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Appointment, AppointmentStatus } from '@prisma/client';

import { AppointmentWithRelations } from '../../domain/repository/appointment.repository';

export class AppointmentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tenantId!: string;

  @ApiProperty()
  startsAt!: Date;

  @ApiProperty()
  endsAt!: Date;

  @ApiProperty({ enum: AppointmentStatus })
  status!: AppointmentStatus;

  @ApiProperty({ example: 15000, description: 'Preço praticado, em centavos' })
  priceInCents!: number;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiPropertyOptional({ nullable: true })
  cancelReason!: string | null;

  @ApiProperty({ type: 'object', additionalProperties: true })
  patient!: { id: string; name: string; phone: string };

  @ApiProperty({ type: 'object', additionalProperties: true })
  professional!: { id: string; name: string };

  @ApiProperty({ type: 'object', additionalProperties: true })
  procedure!: { id: string; name: string; durationMinutes: number };

  static fromEntity(
    appointment: AppointmentWithRelations,
  ): AppointmentResponseDto {
    return {
      id: appointment.id,
      tenantId: appointment.tenantId,
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      status: appointment.status,
      priceInCents: appointment.priceInCents,
      notes: appointment.notes,
      cancelReason: appointment.cancelReason,
      patient: appointment.patient,
      professional: appointment.professional,
      procedure: appointment.procedure,
    };
  }

  /** Para respostas de create/update, que não trazem as relações carregadas. */
  static fromPlain(appointment: Appointment) {
    return {
      id: appointment.id,
      tenantId: appointment.tenantId,
      patientId: appointment.patientId,
      professionalId: appointment.professionalId,
      procedureId: appointment.procedureId,
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      status: appointment.status,
      priceInCents: appointment.priceInCents,
      notes: appointment.notes,
      cancelReason: appointment.cancelReason,
    };
  }
}
