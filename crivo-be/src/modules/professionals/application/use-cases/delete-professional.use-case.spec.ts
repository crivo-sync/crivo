import { ConflictException, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import type { SyncExtraProfessionalsUseCase } from 'src/modules/billing/application/use-cases/sync-extra-professionals.use-case';
import type { ProfessionalRepository } from '../../domain/repository/professional.repository';
import { DeleteProfessionalUseCase } from './delete-professional.use-case';

const TENANT_ID = 'tenant-1';
const PROFESSIONAL_ID = 'prof-1';

function makeUseCase({
  found = true,
  upcomingAppointments = 0,
}: {
  found?: boolean;
  upcomingAppointments?: number;
} = {}) {
  const repository = {
    findByIdAndTenant: jest
      .fn()
      .mockResolvedValue(found ? { id: PROFESSIONAL_ID } : null),
    softDelete: jest.fn().mockResolvedValue(undefined),
  } as unknown as ProfessionalRepository;

  const prisma = {
    appointment: {
      count: jest.fn().mockResolvedValue(upcomingAppointments),
    },
  } as unknown as PrismaService;

  const syncExtraProfessionals = {
    execute: jest.fn().mockResolvedValue(undefined),
  } as unknown as SyncExtraProfessionalsUseCase;

  return {
    useCase: new DeleteProfessionalUseCase(
      repository,
      prisma,
      syncExtraProfessionals,
    ),
    repository,
    syncExtraProfessionals,
  };
}

describe('DeleteProfessionalUseCase', () => {
  it('remove e sincroniza a cobrança do adicional', async () => {
    const { useCase, repository, syncExtraProfessionals } = makeUseCase();

    await useCase.execute(PROFESSIONAL_ID, TENANT_ID);

    expect(repository.softDelete).toHaveBeenCalledWith(PROFESSIONAL_ID);
    /**
     * A remoção pode levar a clínica de volta para dentro do teto do plano
     * — sem recalcular aqui, ela continuaria pagando pelo adicional de um
     * profissional que não existe mais.
     */
    expect(syncExtraProfessionals.execute).toHaveBeenCalledWith(TENANT_ID);
  });

  it('profissional inexistente não sincroniza nada', async () => {
    const { useCase, syncExtraProfessionals } = makeUseCase({ found: false });

    await expect(useCase.execute(PROFESSIONAL_ID, TENANT_ID)).rejects.toThrow(
      NotFoundException,
    );
    expect(syncExtraProfessionals.execute).not.toHaveBeenCalled();
  });

  it('agenda futura bloqueia a remoção e não sincroniza nada', async () => {
    const { useCase, repository, syncExtraProfessionals } = makeUseCase({
      upcomingAppointments: 2,
    });

    await expect(useCase.execute(PROFESSIONAL_ID, TENANT_ID)).rejects.toThrow(
      ConflictException,
    );
    expect(repository.softDelete).not.toHaveBeenCalled();
    expect(syncExtraProfessionals.execute).not.toHaveBeenCalled();
  });
});
