import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageChannel, MessageStatus, MessageType } from '@prisma/client';

import { MessageWithPatient } from '../../domain/repository/message.repository';

export class MessageResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: MessageChannel })
  channel!: MessageChannel;

  @ApiProperty({ enum: MessageType })
  type!: MessageType;

  @ApiProperty({ enum: MessageStatus })
  status!: MessageStatus;

  @ApiProperty({ example: '11987650001' })
  toPhone!: string;

  @ApiProperty()
  body!: string;

  @ApiProperty({ description: 'Tentativas de envio já realizadas' })
  attempts!: number;

  @ApiPropertyOptional({ nullable: true })
  lastError!: string | null;

  @ApiPropertyOptional({ nullable: true })
  sentAt!: Date | null;

  @ApiPropertyOptional({
    nullable: true,
    description:
      'Quando a última tentativa esgotou e o envio foi dado como falho',
  })
  failedAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  scheduledFor!: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Paciente e horário, quando a mensagem é de um agendamento',
  })
  appointment!: {
    id: string;
    startsAt: Date;
    patient: { id: string; name: string; phone: string };
  } | null;

  static fromEntity(message: MessageWithPatient): MessageResponseDto {
    return {
      id: message.id,
      channel: message.channel,
      type: message.type,
      status: message.status,
      toPhone: message.toPhone,
      body: message.body,
      attempts: message.attempts,
      lastError: message.lastError,
      sentAt: message.sentAt,
      failedAt: message.failedAt,
      scheduledFor: message.scheduledFor,
      createdAt: message.createdAt,
      appointment: message.appointment,
    };
  }
}
