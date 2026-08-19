import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageStatus, MessageType, ReplyIntent } from '@prisma/client';

import type { ConversationEntry } from '../../application/use-cases/get-conversation.use-case';

/**
 * `Message` (envio) e `InboundMessage` (recebimento) têm colunas diferentes
 * — status/tentativas só existem numa, intent só na outra. Achatar as duas
 * num formato só de resposta é o que permite ao frontend renderizar uma
 * lista única de "bolhas" sem checar `direction` campo a campo.
 */
export class ConversationEntryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ['OUT', 'IN'] })
  direction!: 'OUT' | 'IN';

  @ApiProperty()
  body!: string;

  @ApiProperty()
  at!: Date;

  @ApiPropertyOptional({ enum: MessageType, nullable: true })
  type!: MessageType | null;

  @ApiPropertyOptional({ enum: MessageStatus, nullable: true })
  status!: MessageStatus | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Só em mensagens enviadas que falharam',
  })
  lastError!: string | null;

  @ApiPropertyOptional({ enum: ReplyIntent, nullable: true })
  intent!: ReplyIntent | null;

  static fromEntry(entry: ConversationEntry): ConversationEntryResponseDto {
    if (entry.direction === 'OUT') {
      return {
        id: entry.message.id,
        direction: 'OUT',
        body: entry.message.body,
        at: entry.at,
        type: entry.message.type,
        status: entry.message.status,
        lastError: entry.message.lastError,
        intent: null,
      };
    }

    return {
      id: entry.message.id,
      direction: 'IN',
      body: entry.message.body,
      at: entry.at,
      type: null,
      status: null,
      lastError: null,
      intent: entry.message.intent,
    };
  }
}
