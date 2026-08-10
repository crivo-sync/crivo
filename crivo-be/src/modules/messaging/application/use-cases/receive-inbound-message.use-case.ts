import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';

export type ReceiveInboundMessageInput = {
  tenantId: string;
  /** Telefone de origem, como veio do provider (normalizado aqui). */
  fromPhone: string;
  body: string;
  provider: string;
  /** Id da mensagem no provider — usado para não gravar o mesmo evento duas vezes. */
  providerMessageId?: string;
  /** Quando o paciente enviou, pelo relógio do provider. */
  sentAt: Date;
};

export type ReceiveInboundMessageResult = {
  /** `false` quando o webhook reentregou um evento já registrado. */
  stored: boolean;
  patientId: string | null;
};

@Injectable()
export class ReceiveInboundMessageUseCase {
  private readonly logger = new Logger(ReceiveInboundMessageUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(
    input: ReceiveInboundMessageInput,
  ): Promise<ReceiveInboundMessageResult> {
    const fromPhone = normalizePhone(input.fromPhone);
    const patientId = await this.findPatientByPhone(input.tenantId, fromPhone);

    try {
      const created = await this.prisma.inboundMessage.create({
        data: {
          tenantId: input.tenantId,
          patientId,
          fromPhone,
          body: input.body,
          provider: input.provider,
          providerMessageId: input.providerMessageId,
          sentAt: input.sentAt,
        },
      });

      this.logger.log(
        `Mensagem recebida de ${fromPhone}${
          patientId ? '' : ' (número não cadastrado)'
        } — ${created.id}`,
      );

      return { stored: true, patientId };
    } catch (error) {
      // Reentrega do mesmo evento: o WhatsApp repete o webhook quando não
      // recebe 200 a tempo. Cair no índice único é o comportamento
      // esperado, não uma falha — responder erro faria o provider tentar de
      // novo em looping.
      if (isUniqueViolation(error)) {
        this.logger.debug(
          `Evento repetido ignorado (${input.providerMessageId ?? 'sem id'})`,
        );
        return { stored: false, patientId };
      }

      throw error;
    }
  }

  /**
   * Casa o remetente com um paciente pelo telefone.
   *
   * A comparação é feita no banco sobre o telefone **sem máscara** porque o
   * cadastro guarda o que a recepção digitou (`(11) 98765-4321`) e o provider
   * entrega só dígitos com DDI (`5511987654321`) — comparar os dois campos
   * crus não casaria ninguém. Carregar a tabela inteira para filtrar em
   * memória funcionaria com o seed, mas não com uma clínica de milhares de
   * pacientes recebendo mensagem a cada minuto.
   *
   * Compara pelo número sem DDI (DDD + assinante), que é o maior sufixo
   * estável entre os dois formatos.
   */
  private async findPatientByPhone(
    tenantId: string,
    fromPhone: string,
  ): Promise<string | null> {
    const local = fromPhone.startsWith('55') ? fromPhone.slice(2) : fromPhone;

    // Menos que isso não identifica ninguém com segurança (8 dígitos do
    // assinante + 2 do DDD).
    if (local.length < 10) return null;

    const candidates = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id
      FROM patients
      WHERE tenant_id = ${tenantId}
        AND deleted_at IS NULL
        AND regexp_replace(phone, '\\D', '', 'g') LIKE ${'%' + local}
      LIMIT 2
    `;

    // Dois cadastros com o mesmo número (paciente e acompanhante, por
    // exemplo): sem como saber qual dos dois escreveu, é mais honesto deixar
    // sem vínculo do que atribuir a conversa à pessoa errada.
    if (candidates.length !== 1) {
      if (candidates.length > 1) {
        this.logger.warn(
          `Telefone ${fromPhone} bate com mais de um paciente — mensagem fica sem vínculo.`,
        );
      }
      return null;
    }

    return candidates[0].id;
  }
}

/** Só dígitos — o provider varia entre `+55 11…`, `5511…@c.us` e afins. */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  );
}
