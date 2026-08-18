import { ForbiddenException } from '@nestjs/common';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import type { ProfessionalRepository } from '../../domain/repository/professional.repository';
import { CreateProfessionalUseCase } from './create-professional.use-case';

const TENANT_ID = 'tenant-1';

describe('CreateProfessionalUseCase — limite de plano', () => {
  function makeUseCase(
    plan: { maxProfessionals: number | null; name: string } | null,
    activeCount: number,
    /**
     * Catálogo de planos ativos — é dele que sai o teto do trial (o maior
     * `maxProfessionals`). Default espelha os planos reais: Solo 1,
     * Essencial 2, Profissional 4, Clínica 8.
     */
    planosAtivos: { maxProfessionals: number | null }[] = [
      { maxProfessionals: 1 },
      { maxProfessionals: 2 },
      { maxProfessionals: 4 },
      { maxProfessionals: 8 },
    ],
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
      plan: {
        findMany: jest.fn().mockResolvedValue(planosAtivos),
      },
    } as unknown as PrismaService;

    return {
      useCase: new CreateProfessionalUseCase(repository, prisma),
      repository,
    };
  }

  /**
   * Trial não é mais ilimitado: tem o teto do **maior plano** (8, no
   * catálogo real). Liberar tudo fazia a clínica cadastrar 10 profissionais
   * no teste e descobrir na assinatura que o plano comporta 1 — problema que
   * ela não tinha como antecipar e que caía no pior momento possível.
   */
  it('cria no trial enquanto estiver dentro do teto do maior plano', async () => {
    const { useCase, repository } = makeUseCase(null, 7);

    await useCase.execute({ tenantId: TENANT_ID, name: 'Dra. Ana' });

    expect(repository.create).toHaveBeenCalled();
  });

  it('recusa no trial ao bater o teto do maior plano', async () => {
    const { useCase, repository } = makeUseCase(null, 8);

    await expect(
      useCase.execute({ tenantId: TENANT_ID, name: 'Dra. Ana' }),
    ).rejects.toThrow(ForbiddenException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  /** Se existe plano sem teto no catálogo, o trial também não tem. */
  it('não limita o trial quando algum plano ativo é ilimitado', async () => {
    const { useCase, repository } = makeUseCase(null, 99, [
      { maxProfessionals: 2 },
      { maxProfessionals: null },
    ]);

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

  /**
   * Regressão do bug de 17/08/2026: uma versão intermediária desta regra
   * deixava passar do teto quando o plano vendia "profissional adicional"
   * (`stripeExtraProfessionalPriceId` configurado), contando com
   * `SyncExtraProfessionalsUseCase` para cobrar a diferença depois. Na
   * prática isso removia o limite de qualquer plano que vendesse adicional
   * — uma clínica real foi de 2 para 3 profissionais no Essencial (limite
   * 2) sem nenhum bloqueio. Este teste garante que o teto volta a valer
   * mesmo quando a faixa tem preço de adicional configurado.
   */
  it('recusa no teto mesmo quando o plano tem preço de adicional configurado', async () => {
    const { useCase, repository } = makeUseCase(
      { maxProfessionals: 2, name: 'Essencial' },
      2,
    );

    await expect(
      useCase.execute({ tenantId: TENANT_ID, name: 'Dra. Ana' }),
    ).rejects.toThrow(ForbiddenException);
    expect(repository.create).not.toHaveBeenCalled();
  });
});
