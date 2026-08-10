import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import type { AppointmentRepository } from '../../domain/repository/appointment.repository';
import { BusinessHoursService } from '../services/business-hours.service';
import { ProfessionalAvailabilityService } from '../services/professional-availability.service';
import { GetAvailabilityUseCase } from './get-availability.use-case';

type Window = { weekday: number; startMinutes: number; endMinutes: number };

/**
 * Cenários em que `slots` vem vazio: é exatamente o caso em que a recepção
 * vê espaço no Quadro, tenta agendar e só recebe "nenhum horário livre".
 * O teste fixa o `noSlotsReason` para cada situação — sem isso a mensagem
 * genérica parece bug.
 */
describe('GetAvailabilityUseCase', () => {
  const TENANT_ID = 'tenant-1';
  const PROFESSIONAL_ID = 'prof-1';
  const PROCEDURE_ID = 'proc-1';

  // Datas de quarta-feira (getDay() === 3) — passada e futura, para não
  // depender do relógio real na hora de rodar o teste.
  const WEDNESDAY_PAST = new Date(2024, 7, 7); // 07/08/2024
  const WEDNESDAY_FUTURE = new Date(2027, 7, 4); // 04/08/2027

  const FULL_WEEKDAY: Window = {
    weekday: 3,
    startMinutes: 480,
    endMinutes: 1080,
  };
  const MORNING_WEEKDAY: Window = {
    weekday: 3,
    startMinutes: 480,
    endMinutes: 720,
  };
  const MONDAY_ONLY: Window = {
    weekday: 1,
    startMinutes: 480,
    endMinutes: 720,
  };

  function buildUseCase(options: {
    durationMinutes?: number;
    procedures?: { id: string }[];
    businessDays?: number[];
    appointments?: Array<{
      id: string;
      status: string;
      startsAt: Date;
      endsAt: Date;
    }>;
    schedules?: Window[];
    timeOff?: Array<{ startsAt: Date; endsAt: Date; reason: string | null }>;
  }) {
    const {
      durationMinutes = 30,
      procedures = [],
      businessDays = [1, 2, 3, 4, 5],
      appointments = [],
      schedules = [],
      timeOff = [],
    } = options;

    const prisma = {
      procedure: {
        findFirst: jest.fn().mockResolvedValue({ durationMinutes }),
      },
      professional: {
        findFirst: jest.fn().mockResolvedValue({ procedures }),
      },
    } as unknown as PrismaService;

    const businessHours = {
      getConfig: jest.fn().mockResolvedValue({
        businessHoursStart: 480,
        businessHoursEnd: 1080,
        businessDays,
      }),
    } as unknown as BusinessHoursService;

    const repository = {
      findMany: jest.fn().mockResolvedValue({ data: appointments }),
    } as unknown as AppointmentRepository;

    const professionalAvailability = new ProfessionalAvailabilityService(
      {} as PrismaService,
    );
    jest
      .spyOn(professionalAvailability, 'load')
      .mockResolvedValue({ schedules, timeOff });

    return new GetAvailabilityUseCase(
      repository,
      prisma,
      businessHours,
      professionalAvailability,
    );
  }

  it('devolve horários quando o dia está livre', async () => {
    const useCase = buildUseCase({ schedules: [FULL_WEEKDAY] });

    const result = await useCase.execute({
      tenantId: TENANT_ID,
      professionalId: PROFESSIONAL_ID,
      procedureId: PROCEDURE_ID,
      date: WEDNESDAY_FUTURE,
    });

    expect(result.slots.length).toBeGreaterThan(0);
    expect(result.closed).toBe(false);
    expect(result.noSlotsReason).toBeUndefined();
  });

  it('marca o dia como fechado quando a clínica não atende', async () => {
    const useCase = buildUseCase({ businessDays: [1, 2] });

    const result = await useCase.execute({
      tenantId: TENANT_ID,
      professionalId: PROFESSIONAL_ID,
      procedureId: PROCEDURE_ID,
      date: WEDNESDAY_FUTURE,
    });

    expect(result.closed).toBe(true);
    expect(result.slots).toEqual([]);
    expect(result.noSlotsReason).toBeUndefined();
  });

  it('explica que o profissional não atende neste dia da semana', async () => {
    const useCase = buildUseCase({ schedules: [MONDAY_ONLY] });

    const result = await useCase.execute({
      tenantId: TENANT_ID,
      professionalId: PROFESSIONAL_ID,
      procedureId: PROCEDURE_ID,
      date: WEDNESDAY_PAST,
    });

    expect(result.slots).toEqual([]);
    expect(result.noSlotsReason).toBe('NOT_WORKING_DAY');
    expect(result.scheduleWindows).toEqual([]);
  });

  it('diz quando o atendimento do dia já passou', async () => {
    const useCase = buildUseCase({ schedules: [MORNING_WEEKDAY] });

    const result = await useCase.execute({
      tenantId: TENANT_ID,
      professionalId: PROFESSIONAL_ID,
      procedureId: PROCEDURE_ID,
      date: WEDNESDAY_PAST,
    });

    expect(result.slots).toEqual([]);
    expect(result.noSlotsReason).toBe('WINDOW_PASSED');
    expect(result.scheduleWindows).toEqual([
      { startMinutes: 480, endMinutes: 720 },
    ]);
  });

  it('diz quando a agenda está cheia, e não que falta grade', async () => {
    const busy = [
      {
        id: 'a1',
        status: 'CONFIRMED',
        startsAt: new Date(2027, 7, 4, 8, 0),
        endsAt: new Date(2027, 7, 4, 12, 0),
      },
    ];
    const useCase = buildUseCase({
      schedules: [MORNING_WEEKDAY],
      appointments: busy,
    });

    const result = await useCase.execute({
      tenantId: TENANT_ID,
      professionalId: PROFESSIONAL_ID,
      procedureId: PROCEDURE_ID,
      date: WEDNESDAY_FUTURE,
    });

    expect(result.slots).toEqual([]);
    expect(result.noSlotsReason).toBe('ALL_BUSY');
  });

  it('diz quando um bloqueio cobre o dia', async () => {
    const useCase = buildUseCase({
      schedules: [MORNING_WEEKDAY],
      timeOff: [
        {
          startsAt: new Date(2027, 7, 4, 0, 0),
          endsAt: new Date(2027, 7, 5, 0, 0),
          reason: 'Férias',
        },
      ],
    });

    const result = await useCase.execute({
      tenantId: TENANT_ID,
      professionalId: PROFESSIONAL_ID,
      procedureId: PROCEDURE_ID,
      date: WEDNESDAY_FUTURE,
    });

    expect(result.slots).toEqual([]);
    expect(result.noSlotsReason).toBe('TIME_OFF');
    expect(result.timeOff?.reason).toBe('Férias');
  });
});
