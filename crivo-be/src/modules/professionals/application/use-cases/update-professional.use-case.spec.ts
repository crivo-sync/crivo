import { ForbiddenException } from '@nestjs/common';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import type { ProfessionalRepository } from '../../domain/repository/professional.repository';
import { UpdateProfessionalUseCase } from './update-professional.use-case';

const TENANT_ID = 'tenant-1';

/**
 * Reativar ocupa vaga, igual a cadastrar.
 *
 * Sem essa checagem o limite tinha uma porta dos fundos: a clínica desativa
 * dois profissionais para caber no plano e reativa os dois pelo PATCH
 * normal, voltando a ficar acima do teto sem passar por nada que checasse.
 */
describe('UpdateProfessionalUseCase — reativação respeita o limite', () => {
  function makeUseCase({
    maxProfessionals,
    ocupadas,
    estavaAtivo,
  }: {
    maxProfessionals: number | null;
    ocupadas: number;
    estavaAtivo: boolean;
  }) {
    const repository = {
      findByIdAndTenant: jest
        .fn()
        .mockResolvedValue({ id: 'prof-1', isActive: estavaAtivo }),
      update: jest.fn().mockResolvedValue({ id: 'prof-1' }),
    } as unknown as ProfessionalRepository;

    const prisma = {
      tenant: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          plan: { maxProfessionals, name: 'Solo' },
        }),
      },
      professional: {
        count: jest.fn().mockResolvedValue(ocupadas),
      },
      plan: {
        findMany: jest.fn().mockResolvedValue([{ maxProfessionals: 8 }]),
      },
      procedure: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    } as unknown as PrismaService;

    return {
      useCase: new UpdateProfessionalUseCase(repository, prisma),
      repository,
    };
  }

  it('recusa reativar quando não há vaga no plano', async () => {
    const { useCase, repository } = makeUseCase({
      maxProfessionals: 1,
      ocupadas: 1,
      estavaAtivo: false,
    });

    await expect(
      useCase.execute({ id: 'prof-1', tenantId: TENANT_ID, isActive: true }),
    ).rejects.toThrow(ForbiddenException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('permite reativar quando ainda há vaga', async () => {
    const { useCase, repository } = makeUseCase({
      maxProfessionals: 3,
      ocupadas: 1,
      estavaAtivo: false,
    });

    await useCase.execute({
      id: 'prof-1',
      tenantId: TENANT_ID,
      isActive: true,
    });

    expect(repository.update).toHaveBeenCalled();
  });

  /**
   * Editar nome/telefone de quem **já está ativo** não pode esbarrar no
   * limite: a vaga já é dele, e travar a edição deixaria a clínica acima do
   * teto sem conseguir nem corrigir um telefone errado.
   */
  it('não checa limite ao editar quem já está ativo', async () => {
    const { useCase, repository } = makeUseCase({
      maxProfessionals: 1,
      ocupadas: 5,
      estavaAtivo: true,
    });

    await useCase.execute({
      id: 'prof-1',
      tenantId: TENANT_ID,
      name: 'Dra. Ana Paula',
    });

    expect(repository.update).toHaveBeenCalled();
  });

  it('não checa limite ao desativar', async () => {
    const { useCase, repository } = makeUseCase({
      maxProfessionals: 1,
      ocupadas: 5,
      estavaAtivo: true,
    });

    await useCase.execute({
      id: 'prof-1',
      tenantId: TENANT_ID,
      isActive: false,
    });

    expect(repository.update).toHaveBeenCalled();
  });
});
