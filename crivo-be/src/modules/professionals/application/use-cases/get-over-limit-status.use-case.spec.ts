import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { GetOverLimitStatusUseCase } from './get-over-limit-status.use-case';

const TENANT_ID = 'tenant-1';

describe('GetOverLimitStatusUseCase', () => {
  function makeUseCase({
    plan,
    activeCount,
    planosAtivos = [{ maxProfessionals: 8 }],
  }: {
    plan: { maxProfessionals: number | null; name: string } | null;
    activeCount: number;
    planosAtivos?: { maxProfessionals: number | null }[];
  }) {
    const prisma = {
      tenant: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({ plan }),
      },
      professional: {
        count: jest.fn().mockResolvedValue(activeCount),
      },
      plan: {
        findMany: jest.fn().mockResolvedValue(planosAtivos),
      },
    } as unknown as PrismaService;

    return new GetOverLimitStatusUseCase(prisma);
  }

  /** O caso que motivou tudo: testou o trial com a equipe, assinou o Solo. */
  it('acusa excedente quando a equipe não cabe no plano assinado', async () => {
    const useCase = makeUseCase({
      plan: { maxProfessionals: 1, name: 'Solo' },
      activeCount: 3,
    });

    await expect(useCase.execute(TENANT_ID)).resolves.toEqual({
      overLimit: true,
      activeCount: 3,
      maxProfessionals: 1,
      excess: 2,
      planName: 'Solo',
    });
  });

  it('não acusa quando a equipe cabe exatamente no teto', async () => {
    const useCase = makeUseCase({
      plan: { maxProfessionals: 2, name: 'Essencial' },
      activeCount: 2,
    });

    await expect(useCase.execute(TENANT_ID)).resolves.toMatchObject({
      overLimit: false,
      excess: 0,
    });
  });

  it('não acusa quando o plano não tem teto', async () => {
    const useCase = makeUseCase({
      plan: { maxProfessionals: null, name: 'Ilimitado' },
      activeCount: 50,
    });

    await expect(useCase.execute(TENANT_ID)).resolves.toMatchObject({
      overLimit: false,
      maxProfessionals: null,
    });
  });

  /** Trial usa o teto do maior plano, não "ilimitado". */
  it('acusa excedente no trial usando o teto do maior plano', async () => {
    const useCase = makeUseCase({
      plan: null,
      activeCount: 10,
      planosAtivos: [{ maxProfessionals: 2 }, { maxProfessionals: 8 }],
    });

    await expect(useCase.execute(TENANT_ID)).resolves.toMatchObject({
      overLimit: true,
      maxProfessionals: 8,
      excess: 2,
      planName: null,
    });
  });
});
