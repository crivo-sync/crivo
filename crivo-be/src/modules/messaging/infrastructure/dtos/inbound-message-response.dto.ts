import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageChannel, ReplyIntent } from '@prisma/client';

import { InboundMessageWithRelations } from '../../domain/repository/inbound-message.repository';

export class InboundMessageResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: MessageChannel })
  channel!: MessageChannel;

  @ApiProperty({ example: '5511987650001' })
  fromPhone!: string;

  @ApiProperty()
  body!: string;

  @ApiProperty({
    enum: ReplyIntent,
    description: 'O que o sistema entendeu da resposta',
  })
  intent!: ReplyIntent;

  @ApiProperty({ description: 'Quando o paciente enviou' })
  sentAt!: Date;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Quando a clínica deu a mensagem por tratada',
  })
  readAt!: Date | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Nulo quando o número não bate com nenhum cadastro',
  })
  patient!: { id: string; name: string; phone: string } | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Agendamento afetado por esta resposta, quando houve',
  })
  appointment!: { id: string; startsAt: Date } | null;

  static fromEntity(
    message: InboundMessageWithRelations,
  ): InboundMessageResponseDto {
    return {
      id: message.id,
      channel: message.channel,
      fromPhone: message.fromPhone,
      body: message.body,
      intent: message.intent,
      sentAt: message.sentAt,
      readAt: message.readAt,
      patient: message.patient,
      appointment: message.appointment,
    };
  }
}
