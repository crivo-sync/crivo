import { BadRequestException } from '@nestjs/common';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import type { TenantRepository } from '../../domain/repository/tenant.repository';
import { UpdateTenantUseCase } from './update-tenant.use-case';

const TENANT_ID = 'tenant-1';

function makeUseCase(plan: { hasAiMessages: boolean; name: string } | null) {
  const tenantRepository = {
    findById: jest.fn().mockResolvedValue({
      id: TENANT_ID,
      businessHoursStart: 480,
      businessHoursEnd: 1080,
    }),
    update: jest.fn().mockResolvedValue({ id: TENANT_ID }),
  } as unknown as TenantRepository;

  const prisma = {
    tenant: { findUnique: jest.fn().mockResolvedValue({ plan }) },
  } as unknown as PrismaService;

  return {
    useCase: new UpdateTenantUseCase(tenantRepository, prisma),
    tenantRepository,
  };
}

describe('UpdateTenantUseCase — IA é feature de plano', () => {
  it('recusa ligar a IA num plano que não a inclui', async () => {
    const { useCase } = makeUseCase({ hasAiMessages: false, name: 'Básico' });

    await expect(
      useCase.execute(TENANT_ID, { aiMessagesEnabled: true }),
    ).rejects.toThrow(BadRequestException);
  });

  it('a mensagem de erro diz o plano e para onde ir', async () => {
    const { useCase } = makeUseCase({ hasAiMessages: false, name: 'Básico' });

    await expect(
      useCase.execute(TENANT_ID, { aiMessagesEnabled: true }),
    ).rejects.toThrow(/Básico.*Assinatura/s);
  });

  it('deixa ligar quando o plano inclui', async () => {
    const { useCase, tenantRepository } = makeUseCase({
      hasAiMessages: true,
      name: 'Intermediário',
    });

    await useCase.execute(TENANT_ID, { aiMessagesEnabled: true });

    expect(tenantRepository.update).toHaveBeenCalled();
  });

  it('trial (sem plano) pode ligar — é como a clínica experimenta', async () => {
    const { useCase, tenantRepository } = makeUseCase(null);

    await useCase.execute(TENANT_ID, { aiMessagesEnabled: true });

    expect(tenantRepository.update).toHaveBeenCalled();
  });

  it('desligar nunca é bloqueado, mesmo sem direito ao recurso', async () => {
    const { useCase, tenantRepository } = makeUseCase({
      hasAiMessages: false,
      name: 'Básico',
    });

    // Trancar quem já tem o toggle ligado (por dado antigo) seria pior: a
    // clínica ficaria sem conseguir desativar o que não deveria ter.
    await useCase.execute(TENANT_ID, { aiMessagesEnabled: false });

    expect(tenantRepository.update).toHaveBeenCalled();
  });
});
