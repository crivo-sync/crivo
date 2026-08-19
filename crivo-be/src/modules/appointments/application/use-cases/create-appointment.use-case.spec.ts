import { ForbiddenException } from '@nestjs/common';
import { AppointmentOrigin } from '@prisma/client';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import type { ScheduleAppointmentReminderUseCase } from 'src/modules/messaging/application/use-cases/schedule-appointment-reminder.use-case';
import type { AppointmentRepository } from '../../domain/repository/appointment.repository';
import type { BusinessHoursService } from '../services/business-hours.service';
import type { ProfessionalAvailabilityService } from '../services/professional-availability.service';
import { CreateAppointmentUseCase } from './create-appointment.use-case';

const TENANT_ID = 'tenant-1';

/**
 * O limite do plano precisa valer **na hora de marcar**, não só no cadastro
 * de profissional.
 *
 * Sem isto, uma clínica que veio do trial com 4 profissionais e assinou o
 * Solo (1 incluído) seguia agendando normalmente com os 4 — a assinatura
 * dizia uma coisa e a operação fazia outra. Achado com um tenant real
 * nesse estado em 17/08/2026.
 */
describe('CreateAppointmentUseCase — limite de profissionais do plano', () => {
  function makeUseCase({
    maxProfessionals,
    profissionaisAtivos,
  }: {
    maxProfessionals: number | null;
    profissionaisAtivos: number;
  }) {
    const appointmentRepository = {
      findOverlapping: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'apt-1' }),
    } as unknown as AppointmentRepository;

    const prisma = {
      tenant: {
        findUniqueOrThrow: jest
          .fn()
          .mockResolvedValue({ plan: { maxProfessionals } }),
      },
      professional: {
        count: jest.fn().mockResolvedValue(profissionaisAtivos),
        findFirst: jest
          .fn()
          .mockResolvedValue({ id: 'prof-1', procedures: [] }),
      },
      patient: {
        findFirst: jest.fn().mockResolvedValue({ id: 'pat-1' }),
      },
      procedure: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'proc-1',
          durationMinutes: 30,
          priceInCents: 10_000,
        }),
      },
      plan: {
        findMany: jest.fn().mockResolvedValue([{ maxProfessionals: 8 }]),
      },
    } as unknown as PrismaService;

    const scheduleReminder = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as ScheduleAppointmentReminderUseCase;

    const businessHours = {
      assertWithinBusinessHours: jest.fn().mockResolvedValue(undefined),
    } as unknown as BusinessHoursService;

    const professionalAvailability = {
      assertAvailable: jest.fn().mockResolvedValue(undefined),
    } as unknown as ProfessionalAvailabilityService;

    return {
      useCase: new CreateAppointmentUseCase(
        appointmentRepository,
        prisma,
        scheduleReminder,
        businessHours,
        professionalAvailability,
      ),
      appointmentRepository,
    };
  }

  const input = () => ({
    tenantId: TENANT_ID,
    patientId: 'pat-1',
    professionalId: 'prof-1',
    procedureId: 'proc-1',
    // Amanhã: o use case recusa horário no passado antes de qualquer coisa.
    startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  it('recusa agendar quando a clínica está acima do teto do plano', async () => {
    const { useCase, appointmentRepository } = makeUseCase({
      maxProfessionals: 1,
      profissionaisAtivos: 4,
    });

    await expect(useCase.execute(input())).rejects.toThrow(ForbiddenException);
    expect(appointmentRepository.create).not.toHaveBeenCalled();
  });

  it('agenda normalmente quando a equipe cabe no plano', async () => {
    const { useCase, appointmentRepository } = makeUseCase({
      maxProfessionals: 4,
      profissionaisAtivos: 4,
    });

    await useCase.execute(input());

    expect(appointmentRepository.create).toHaveBeenCalled();
  });

  it('agenda normalmente quando o plano não tem teto', async () => {
    const { useCase, appointmentRepository } = makeUseCase({
      maxProfessionals: null,
      profissionaisAtivos: 50,
    });

    await useCase.execute(input());

    expect(appointmentRepository.create).toHaveBeenCalled();
  });

  /**
   * A mensagem é o único lugar onde a recepção descobre o que fazer — sem o
   * caminho ("escolher quem fica" / upgrade) ela só vê "bloqueado" e liga
   * para o suporte.
   */
  it('diz como resolver na mensagem do bloqueio (painel)', async () => {
    const { useCase } = makeUseCase({
      maxProfessionals: 1,
      profissionaisAtivos: 4,
    });

    await expect(useCase.execute(input())).rejects.toThrow(
      /Escolher quem fica.*Assinatura/s,
    );
  });

  /**
   * Vazamento real, corrigido em 17/08/2026: a página pública mostrava ao
   * **paciente** a mensagem interna ("Abra Profissionais → Escolher quem
   * fica, ou faça upgrade em Configurações → Assinatura"). Ele não tem
   * painel, não assina nada e não pode resolver — é expor pendência
   * comercial da clínica a um terceiro, e ainda mandá-lo a uma tela onde
   * não consegue entrar.
   */
  it('não conta ao paciente que o motivo é o plano da clínica', async () => {
    const { useCase } = makeUseCase({
      maxProfessionals: 1,
      profissionaisAtivos: 4,
    });

    const promise = useCase.execute({
      ...input(),
      origin: AppointmentOrigin.ONLINE,
    });

    await expect(promise).rejects.toThrow(/indisponível/i);
    await expect(promise).rejects.not.toThrow(
      /plano|assinatura|upgrade|Configurações|Profissionais/i,
    );
  });

  it('manda o paciente falar com a clínica, que é a única saída dele', async () => {
    const { useCase } = makeUseCase({
      maxProfessionals: 1,
      profissionaisAtivos: 4,
    });

    await expect(
      useCase.execute({ ...input(), origin: AppointmentOrigin.ONLINE }),
    ).rejects.toThrow(/contato com a clínica/i);
  });
});

/**
 * Fecha o ciclo da lista de espera: o agendamento criado a partir de uma
 * vaga oferecida precisa marcar a `WaitlistEntry` como resolvida sozinho.
 *
 * Sem isto, `markOffered` (avisar o paciente) e o agendamento criado depois
 * eram dois atos desconectados — a `WaitlistEntry` ficava presa em
 * `OFFERED` para sempre, mesmo com a vaga de fato ocupada. Achado como
 * lacuna já registrada no ROADMAP antes de ser fechada em 18/08/2026.
 */
describe('CreateAppointmentUseCase — fecha a lista de espera', () => {
  function makeUseCase({
    waitlistEntry,
  }: {
    waitlistEntry: { id: string; patientId: string; status: string } | null;
  }) {
    const appointmentRepository = {
      findOverlapping: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'apt-1' }),
    } as unknown as AppointmentRepository;

    const waitlistEntryUpdate = jest.fn().mockResolvedValue({});

    const prisma = {
      tenant: {
        findUniqueOrThrow: jest
          .fn()
          .mockResolvedValue({ plan: { maxProfessionals: null } }),
      },
      professional: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ id: 'prof-1', procedures: [] }),
      },
      patient: {
        findFirst: jest.fn().mockResolvedValue({ id: 'pat-1' }),
      },
      procedure: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'proc-1',
          durationMinutes: 30,
          priceInCents: 10_000,
        }),
      },
      waitlistEntry: {
        findFirst: jest.fn().mockResolvedValue(waitlistEntry),
        update: waitlistEntryUpdate,
      },
      plan: { findMany: jest.fn() },
    } as unknown as PrismaService;

    const scheduleReminder = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as ScheduleAppointmentReminderUseCase;

    const businessHours = {
      assertWithinBusinessHours: jest.fn().mockResolvedValue(undefined),
    } as unknown as BusinessHoursService;

    const professionalAvailability = {
      assertAvailable: jest.fn().mockResolvedValue(undefined),
    } as unknown as ProfessionalAvailabilityService;

    return {
      useCase: new CreateAppointmentUseCase(
        appointmentRepository,
        prisma,
        scheduleReminder,
        businessHours,
        professionalAvailability,
      ),
      appointmentRepository,
      waitlistEntryUpdate,
    };
  }

  const input = (waitlistEntryId?: string) => ({
    tenantId: TENANT_ID,
    patientId: 'pat-1',
    professionalId: 'prof-1',
    procedureId: 'proc-1',
    startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    waitlistEntryId,
  });

  it('marca a WaitlistEntry como SCHEDULED e linka o agendamento criado', async () => {
    const { useCase, waitlistEntryUpdate } = makeUseCase({
      waitlistEntry: { id: 'wl-1', patientId: 'pat-1', status: 'OFFERED' },
    });

    await useCase.execute(input('wl-1'));

    expect(waitlistEntryUpdate).toHaveBeenCalledWith({
      where: { id: 'wl-1' },
      data: { status: 'SCHEDULED', appointmentId: 'apt-1' },
    });
  });

  it('aceita fechar uma entrada que ainda está WAITING (recepção agendou direto, sem avisar antes)', async () => {
    const { useCase, waitlistEntryUpdate } = makeUseCase({
      waitlistEntry: { id: 'wl-1', patientId: 'pat-1', status: 'WAITING' },
    });

    await useCase.execute(input('wl-1'));

    expect(waitlistEntryUpdate).toHaveBeenCalled();
  });

  it('não mexe em nada quando o agendamento não veio de lista de espera', async () => {
    const { useCase, waitlistEntryUpdate } = makeUseCase({
      waitlistEntry: null,
    });

    await useCase.execute(input());

    expect(waitlistEntryUpdate).not.toHaveBeenCalled();
  });

  it('recusa quando a entrada é de outro paciente', async () => {
    const { useCase, waitlistEntryUpdate } = makeUseCase({
      waitlistEntry: {
        id: 'wl-1',
        patientId: 'outro-paciente',
        status: 'OFFERED',
      },
    });

    await expect(useCase.execute(input('wl-1'))).rejects.toThrow(
      /outro paciente/i,
    );
    expect(waitlistEntryUpdate).not.toHaveBeenCalled();
  });

  it('recusa reusar uma entrada já SCHEDULED', async () => {
    const { useCase, waitlistEntryUpdate } = makeUseCase({
      waitlistEntry: { id: 'wl-1', patientId: 'pat-1', status: 'SCHEDULED' },
    });

    await expect(useCase.execute(input('wl-1'))).rejects.toThrow(
      /já foi resolvido/i,
    );
    expect(waitlistEntryUpdate).not.toHaveBeenCalled();
  });

  it('recusa waitlistEntryId inexistente', async () => {
    const { useCase, waitlistEntryUpdate } = makeUseCase({
      waitlistEntry: null,
    });

    await expect(useCase.execute(input('wl-inexistente'))).rejects.toThrow(
      /não encontrado/i,
    );
    expect(waitlistEntryUpdate).not.toHaveBeenCalled();
  });
});
