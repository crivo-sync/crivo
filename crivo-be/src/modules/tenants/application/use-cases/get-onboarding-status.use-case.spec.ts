import { NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { GetOnboardingStatusUseCase } from './get-onboarding-status.use-case';

const TENANT_ID = 'tenant-1';

function makeUseCase({
  tenant = { subdomain: 'clinica-nova' },
  professionals = 0,
  procedures = 0,
  appointments = 0,
}: {
  tenant?: { subdomain: string } | null;
  professionals?: number;
  procedures?: number;
  appointments?: number;
} = {}) {
  const prisma = {
    tenant: { findUnique: jest.fn().mockResolvedValue(tenant) },
    professional: { count: jest.fn().mockResolvedValue(professionals) },
    procedure: { count: jest.fn().mockResolvedValue(procedures) },
    appointment: { count: jest.fn().mockResolvedValue(appointments) },
  } as unknown as PrismaService;

  return { useCase: new GetOnboardingStatusUseCase(prisma), prisma };
}

describe('GetOnboardingStatusUseCase', () => {
  it('clínica recém-criada tem tudo pendente', async () => {
    const { useCase } = makeUseCase();

    await expect(useCase.execute(TENANT_ID)).resolves.toEqual({
      hasProfessional: false,
      hasProcedure: false,
      hasAppointment: false,
      subdomain: 'clinica-nova',
      isComplete: false,
    });
  });

  it('só fica completo com os três — profissional e procedimento não bastam', async () => {
    const { useCase } = makeUseCase({ professionals: 1, procedures: 1 });

    const result = await useCase.execute(TENANT_ID);

    expect(result.hasProfessional).toBe(true);
    expect(result.hasProcedure).toBe(true);
    expect(result.isComplete).toBe(false);
  });

  it('completo quando profissional, procedimento e primeiro agendamento existem', async () => {
    const { useCase } = makeUseCase({
      professionals: 2,
      procedures: 3,
      appointments: 1,
    });

    await expect(useCase.execute(TENANT_ID)).resolves.toEqual({
      hasProfessional: true,
      hasProcedure: true,
      hasAppointment: true,
      subdomain: 'clinica-nova',
      isComplete: true,
    });
  });

  it('conta só o que a página pública aceita: ativo e não excluído', async () => {
    const { useCase, prisma } = makeUseCase();

    await useCase.execute(TENANT_ID);

    // Divergir dos filtros de `booking-options` faria o checklist dizer
    // "tudo pronto" enquanto o /agendar segue recusando — o problema que
    // ele existe justamente para evitar.
    expect(prisma.professional.count).toHaveBeenCalledWith({
      where: { tenantId: TENANT_ID, isActive: true, deletedAt: null },
    });
    expect(prisma.procedure.count).toHaveBeenCalledWith({
      where: { tenantId: TENANT_ID, isActive: true },
    });
  });

  it('404 quando o tenant não existe', async () => {
    const { useCase } = makeUseCase({ tenant: null });

    await expect(useCase.execute(TENANT_ID)).rejects.toThrow(NotFoundException);
  });
});
