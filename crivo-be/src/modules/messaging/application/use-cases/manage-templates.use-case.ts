import { BadRequestException, Injectable } from '@nestjs/common';
import { MessageType } from '@prisma/client';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { MessageTemplateService } from '../services/message-template.service';
import {
  missingRequiredPlaceholders,
  TEMPLATE_PLACEHOLDERS,
  unknownPlaceholders,
} from '../services/template-renderer';

/**
 * Tipos que a clínica pode personalizar.
 *
 * O recibo de confirmação fica de fora: é uma frase única sem dado variável,
 * e o restante (`MANUAL`) nem tem template.
 */
export const EDITABLE_TYPES: MessageType[] = [
  MessageType.APPOINTMENT_REMINDER,
  MessageType.APPOINTMENT_BOOKED,
];

const MAX_BODY_LENGTH = 1000;

@Injectable()
export class ManageTemplatesUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly templates: MessageTemplateService,
  ) {}

  /**
   * Um item por tipo editável, sempre — inclusive os que a clínica nunca
   * personalizou. A tela precisa mostrar o texto padrão para servir de ponto
   * de partida, senão a recepção começaria de uma caixa vazia.
   */
  async list(tenantId: string) {
    const saved = await this.prisma.messageTemplate.findMany({
      where: { tenantId },
    });

    return EDITABLE_TYPES.map((type) => {
      const custom = saved.find((template) => template.type === type);
      const defaultBody = this.templates.defaultBodyFor(type);

      return {
        type,
        /** O que está no editor (rascunho salvo, ou o padrão como ponto de partida). */
        body: custom?.body ?? defaultBody,
        /**
         * O texto padrão, sempre. A tela precisa dele para mostrar o que o
         * paciente recebe quando a personalização está desligada — sem isso o
         * editor mostraria o rascunho e o paciente receberia outra coisa.
         */
        defaultBody,
        isActive: custom?.isActive ?? false,
        isCustom: !!custom,
        updatedAt: custom?.updatedAt ?? null,
      };
    });
  }

  async save(input: {
    tenantId: string;
    type: MessageType;
    body: string;
    isActive: boolean;
    userId?: string;
  }) {
    if (!EDITABLE_TYPES.includes(input.type)) {
      throw new BadRequestException('Este tipo de mensagem não é editável.');
    }

    this.assertValidBody(input.body);

    return this.prisma.messageTemplate.upsert({
      where: { tenantId_type: { tenantId: input.tenantId, type: input.type } },
      create: {
        tenantId: input.tenantId,
        type: input.type,
        body: input.body.trim(),
        isActive: input.isActive,
        updatedByUserId: input.userId,
      },
      update: {
        body: input.body.trim(),
        isActive: input.isActive,
        updatedByUserId: input.userId,
      },
    });
  }

  /**
   * Valida antes de gravar, não no envio.
   *
   * Um template quebrado só apareceria quando o paciente não recebesse a
   * mensagem — tarde demais, porque a consulta já teria passado.
   */
  private assertValidBody(body: string): void {
    const trimmed = body.trim();

    if (!trimmed) {
      throw new BadRequestException(
        'O texto da mensagem não pode ficar vazio.',
      );
    }

    if (trimmed.length > MAX_BODY_LENGTH) {
      throw new BadRequestException(
        `O texto passa de ${MAX_BODY_LENGTH} caracteres.`,
      );
    }

    const unknown = unknownPlaceholders(trimmed);
    if (unknown.length > 0) {
      const valid = Object.keys(TEMPLATE_PLACEHOLDERS).join(', ');
      throw new BadRequestException(
        `Marcador desconhecido: ${unknown.map((n) => `{{${n}}}`).join(', ')}. ` +
          `Os disponíveis são: ${valid}.`,
      );
    }

    const missing = missingRequiredPlaceholders(trimmed);
    if (missing.length > 0) {
      throw new BadRequestException(
        `A mensagem precisa incluir ${missing.map((n) => `{{${n}}}`).join(', ')}. ` +
          'Sem data e hora o paciente não sabe quando é a consulta, e sem o link não consegue confirmar.',
      );
    }
  }
}
