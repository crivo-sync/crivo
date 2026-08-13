import { NotFoundException } from '@nestjs/common';
import { MessageStatus, MessageType, ReplyIntent } from '@prisma/client';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import type { MessageRepository } from '../../domain/repository/message.repository';
import type { InboundMessageRepository } from '../../domain/repository/inbound-message.repository';
import { GetConversationUseCase } from './get-conversation.use-case';

const TENANT_ID = 'tenant-1';
const PATIENT_ID = 'patient-1';

function makeUseCase({
  patientExists = true,
  sent = [],
  received = [],
}: {
  patientExists?: boolean;
  sent?: Array<Record<string, unknown>>;
  received?: Array<Record<string, unknown>>;
} = {}) {
  const messageRepository = {
    findByPatient: jest.fn().mockResolvedValue(sent),
  } as unknown as MessageRepository;

  const inboundRepository = {
    findByPatient: jest.fn().mockResolvedValue(received),
  } as unknown as InboundMessageRepository;

  const prisma = {
    patient: {
      findFirst: jest
        .fn()
        .mockResolvedValue(patientExists ? { id: PATIENT_ID } : null),
    },
  } as unknown as PrismaService;

  return {
    useCase: new GetConversationUseCase(
      messageRepository,
      inboundRepository,
      prisma,
    ),
    prisma,
  };
}

describe('GetConversationUseCase', () => {
  it('404 quando o paciente não é do tenant (ou não existe)', async () => {
    const { useCase } = makeUseCase({ patientExists: false });

    await expect(useCase.execute(TENANT_ID, PATIENT_ID)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('confere tenantId e deletedAt: null ao buscar o paciente', async () => {
    const { useCase, prisma } = makeUseCase();

    await useCase.execute(TENANT_ID, PATIENT_ID);

    expect(prisma.patient.findFirst).toHaveBeenCalledWith({
      where: { id: PATIENT_ID, tenantId: TENANT_ID, deletedAt: null },
      select: { id: true },
    });
  });

  it('junta envio e recebimento em ordem cronológica, não por tabela', async () => {
    const sentAt9h = {
      id: 'msg-out-1',
      createdAt: new Date('2026-08-12T09:00:00Z'),
      body: 'Sua consulta foi marcada',
      type: MessageType.APPOINTMENT_BOOKED,
      status: MessageStatus.SENT,
      lastError: null,
    };
    const receivedAt10h = {
      id: 'msg-in-1',
      sentAt: new Date('2026-08-12T10:00:00Z'),
      body: 'Confirmado!',
      intent: ReplyIntent.CONFIRM,
    };
    const sentAt11h = {
      id: 'msg-out-2',
      createdAt: new Date('2026-08-12T11:00:00Z'),
      body: 'Obrigado por confirmar',
      type: MessageType.APPOINTMENT_CONFIRMATION_RECEIPT,
      status: MessageStatus.SENT,
      lastError: null,
    };

    const { useCase } = makeUseCase({
      // Fora de ordem de propósito: a fonte é duas tabelas separadas, cada
      // uma devolvida já ordenada por si só — a mescla é o que precisa
      // reordenar entre as duas.
      sent: [sentAt9h, sentAt11h],
      received: [receivedAt10h],
    });

    const result = await useCase.execute(TENANT_ID, PATIENT_ID);

    expect(result.map((entry) => entry.message.id)).toEqual([
      'msg-out-1',
      'msg-in-1',
      'msg-out-2',
    ]);
    expect(result.map((entry) => entry.direction)).toEqual([
      'OUT',
      'IN',
      'OUT',
    ]);
  });

  it('conversa vazia devolve lista vazia, não erro', async () => {
    const { useCase } = makeUseCase();

    await expect(useCase.execute(TENANT_ID, PATIENT_ID)).resolves.toEqual([]);
  });
});
