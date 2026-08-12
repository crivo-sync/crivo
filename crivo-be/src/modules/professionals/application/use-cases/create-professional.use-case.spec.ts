import { ForbiddenException } from '@nestjs/common';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import type { ProfessionalRepository } from '../../domain/repository/professional.repository';
import { CreateProfessionalUseCase } from './create-professional.use-case';

const TENANT_ID = 'tenant-1';

describe('CreateProfessionalUseCase — limite de plano', () => {
  function makeUseCase(
    plan: { maxProfessionals: number | null; name: string } | null,
    activeCount: number,
  ) {
    const repository = {
      create: jest.fn().mockResolvedValue({ id: 'prof-1' }),
    } as unknown as ProfessionalRepository;

    const prisma = {
      tenant: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({ plan }),
      },
      professional: {
        count: jest.fn().mockResolvedValue(activeCount),
      },
    } as unknown as PrismaService;

    return {
      useCase: new CreateProfessionalUseCase(repository, prisma),
      repository,
    };
  }

  it('cria normalmente quando o tenant está em trial (sem plano)', async () => {
    const { useCase, repository } = makeUseCase(null, 99);

    await useCase.execute({ tenantId: TENANT_ID, name: 'Dra. Ana' });

    expect(repository.create).toHaveBeenCalled();
  });

  it('cria normalmente quando o plano não tem limite (maxProfessionals null)', async () => {
    const { useCase, repository } = makeUseCase(
      { maxProfessionals: null, name: 'Intermediário' },
      50,
    );

    await useCase.execute({ tenantId: TENANT_ID, name: 'Dra. Ana' });

    expect(repository.create).toHaveBeenCalled();
  });

  it('cria quando ainda há vaga dentro do limite', async () => {
    const { useCase, repository } = makeUseCase(
      { maxProfessionals: 2, name: 'Básico' },
      1,
    );

    await useCase.execute({ tenantId: TENANT_ID, name: 'Dra. Ana' });

    expect(repository.create).toHaveBeenCalled();
  });

  it('recusa quando o limite do plano já foi atingido', async () => {
    const { useCase, repository } = makeUseCase(
      { maxProfessionals: 2, name: 'Básico' },
      2,
    );

    await expect(
      useCase.execute({ tenantId: TENANT_ID, name: 'Dra. Ana' }),
    ).rejects.toThrow(ForbiddenException);
    expect(repository.create).not.toHaveBeenCalled();
  });
});
