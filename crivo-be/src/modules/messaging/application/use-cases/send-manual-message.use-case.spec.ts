import { NotFoundException } from '@nestjs/common';
import { MessageType } from '@prisma/client';
import type { Queue } from 'bullmq';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import type { MessageRepository } from '../../domain/repository/message.repository';
import { SEND_JOB_OPTIONS } from '../../infrastructure/queue/messaging.queue';
import { SendManualMessageUseCase } from './send-manual-message.use-case';

const TENANT_ID = 'tenant-1';
const PATIENT_ID = 'patient-1';

function makeUseCase({
  patient = { id: PATIENT_ID, phone: '11987654321' },
}: {
  patient?: { id: string; phone: string } | null;
} = {}) {
  const createdMessage = { id: 'message-1' };

  const messageRepository = {
    create: jest.fn().mockResolvedValue(createdMessage),
  } as unknown as MessageRepository;

  const queue = { add: jest.fn() } as unknown as Queue;

  const prisma = {
    patient: { findFirst: jest.fn().mockResolvedValue(patient) },
  } as unknown as PrismaService;

  return {
    useCase: new SendManualMessageUseCase(messageRepository, queue, prisma),
    messageRepository,
    queue,
    prisma,
  };
}

describe('SendManualMessageUseCase', () => {
  it('404 quando o paciente não é do tenant (ou não existe)', async () => {
    const { useCase } = makeUseCase({ patient: null });

    await expect(
      useCase.execute(TENANT_ID, PATIENT_ID, 'Olá!'),
    ).rejects.toThrow(NotFoundException);
  });

  it('grava a mensagem com type MANUAL e o telefone do cadastro', async () => {
    const { useCase, messageRepository } = makeUseCase();

    await useCase.execute(TENANT_ID, PATIENT_ID, 'Sua consulta foi remarcada.');

    expect(messageRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: TENANT_ID,
        patientId: PATIENT_ID,
        type: MessageType.MANUAL,
        toPhone: '11987654321',
        body: 'Sua consulta foi remarcada.',
      }),
    );
  });

  it('enfileira pelo mesmo pipeline de envio automático (fila, retry, jobId)', async () => {
    const { useCase, queue } = makeUseCase();

    await useCase.execute(TENANT_ID, PATIENT_ID, 'Olá!');

    expect(queue.add).toHaveBeenCalledWith(
      'send',
      { messageId: 'message-1' },
      { ...SEND_JOB_OPTIONS, jobId: 'message-1' },
    );
  });
});
