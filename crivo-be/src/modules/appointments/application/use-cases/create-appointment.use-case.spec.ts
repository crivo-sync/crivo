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
