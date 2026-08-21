import { BadRequestException } from '@nestjs/common';
import { AppointmentOrigin } from '@prisma/client';

import { CreateAppointmentUseCase } from 'src/modules/appointments/application/use-cases/create-appointment.use-case';
import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { BookOnlineUseCase } from './book-online.use-case';

const TENANT = { id: 'tenant-1', name: 'Clínica Teste' };

function makeUseCase({
  existingPatient,
}: {
  existingPatient: { id: string } | null;
}) {
  // O client da transação (`tx`) é o que o `resolvePatient` usa — o advisory
  // lock e o find-or-create acontecem dentro dele.
  const tx = {
    $executeRaw: jest.fn().mockResolvedValue(undefined),
    patient: {
      findFirst: jest.fn().mockResolvedValue(existingPatient),
      create: jest.fn().mockResolvedValue({ id: 'patient-novo' }),
    },
  };

  const prisma = {
    tenant: { findFirst: jest.fn().mockResolvedValue(TENANT) },
    professional: {
      findFirst: jest.fn().mockResolvedValue({ id: 'prof-1' }),
    },
    procedure: { findFirst: jest.fn().mockResolvedValue({ id: 'proc-1' }) },
    $transaction: jest.fn((cb: (t: typeof tx) => unknown) => cb(tx)),
  } as unknown as PrismaService;

  const createAppointment = {
    execute: jest.fn().mockResolvedValue({ id: 'appt-1' }),
  } as unknown as CreateAppointmentUseCase;

  return {
    useCase: new BookOnlineUseCase(prisma, createAppointment),
    prisma,
    tx,
    createAppointment,
  };
}

const INPUT = {
  subdomain: 'clinica',
  patientName: 'Maria',
  patientPhone: '(11) 99999-1234',
  professionalId: 'prof-1',
  procedureId: 'proc-1',
  startsAt: new Date('2027-01-15T13:00:00.000Z'),
  notes: undefined,
};

describe('BookOnlineUseCase', () => {
  it('reusa o paciente existente pelo telefone — não duplica cadastro', async () => {
    const { useCase, tx, createAppointment } = makeUseCase({
      existingPatient: { id: 'patient-1' },
    });

    await useCase.execute(INPUT);

    expect(tx.patient.create).not.toHaveBeenCalled();
    expect(createAppointment.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: TENANT.id,
        patientId: 'patient-1',
        origin: AppointmentOrigin.ONLINE,
      }),
    );
  });

  it('cadastra paciente novo quando o telefone não existe', async () => {
    const { useCase, tx, createAppointment } = makeUseCase({
      existingPatient: null,
    });

    await useCase.execute(INPUT);

    expect(tx.patient.create).toHaveBeenCalledWith({
      data: {
        tenantId: TENANT.id,
        name: 'Maria',
        phone: '11999991234',
      },
      select: { id: true },
    });
    expect(createAppointment.execute).toHaveBeenCalledWith(
      expect.objectContaining({ patientId: 'patient-novo' }),
    );
  });

  it('serializa o find-or-create com advisory lock por telefone', async () => {
    // Regressão de 21/08/2026: duas requisições simultâneas do mesmo telefone
    // passavam as duas no `findFirst` e as duas criavam — paciente duplicado.
    // O lock deixa a segunda esperar a primeira e achar o cadastro recém-feito.
    const { useCase, tx } = makeUseCase({ existingPatient: null });

    await useCase.execute(INPUT);

    expect(tx.$executeRaw).toHaveBeenCalledWith(
      expect.arrayContaining([expect.stringContaining('pg_advisory_xact_lock')]),
      // O valor interpolado na tagged template: a chave (tenant:telefone)
      // que identifica a fila de serialização.
      expect.stringContaining(`${TENANT.id}:11999991234`),
    );
  });

  it('rejeita telefone inválido antes de tocar no banco', async () => {
    const { useCase } = makeUseCase({ existingPatient: null });

    await expect(
      useCase.execute({ ...INPUT, patientPhone: '123' }),
    ).rejects.toThrow(BadRequestException);
  });
});
