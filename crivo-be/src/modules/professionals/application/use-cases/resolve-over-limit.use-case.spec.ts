import { BadRequestException, ConflictException } from '@nestjs/common';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { ResolveOverLimitUseCase } from './resolve-over-limit.use-case';

const TENANT_ID = 'tenant-1';

/**
 * A tela de "escolha quem fica", que resolve o estado criado pelo trial:
 * a clínica testou com a equipe inteira e assinou um plano menor.
 */
describe('ResolveOverLimitUseCase', () => {
  function makeUseCase({
    maxProfessionals = 1,
    ativos = [
      { id: 'p1', name: 'Dra. Ana' },
      { id: 'p2', name: 'Dr. Bruno' },
      { id: 'p3', name: 'Dra. Carla' },
    ],
    comAgendaFutura = [] as {
      professionalId: string;
      _count: { _all: number };
    }[],
  }: {
    maxProfessionals?: number | null;
    ativos?: { id: string; name: string }[];
    comAgendaFutura?: { professionalId: string; _count: { _all: number } }[];
  } = {}) {
    const prisma = {
      tenant: {
        findUniqueOrThrow: jest
          .fn()
          .mockResolvedValue({ plan: { maxProfessionals } }),
      },
      professional: {
        findMany: jest.fn().mockResolvedValue(ativos),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      appointment: {
        groupBy: jest.fn().mockResolvedValue(comAgendaFutura),
      },
      plan: {
        findMany: jest.fn().mockResolvedValue([{ maxProfessionals: 8 }]),
      },
    } as unknown as PrismaService;

    return { useCase: new ResolveOverLimitUseCase(prisma), prisma };
  }

  it('desativa todos que ficaram fora da lista de quem fica', async () => {
    const { useCase, prisma } = makeUseCase();

    const result = await useCase.execute({
      tenantId: TENANT_ID,
      keepProfessionalIds: ['p1'],
    });

    expect(result).toEqual({ deactivated: 2 });
    expect(prisma.professional.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['p2', 'p3'] }, tenantId: TENANT_ID },
      data: { isActive: false },
    });
  });

  /**
   * Desativa, **nunca remove**: agenda, histórico e prontuário continuam no
   * banco. Se a clínica subir de plano depois, é só reativar.
   */
  it('desativa em vez de apagar', async () => {
    const { useCase, prisma } = makeUseCase();

    await useCase.execute({
      tenantId: TENANT_ID,
      keepProfessionalIds: ['p1'],
    });

    expect(prisma.professional.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false } }),
    );
  });

  it('recusa quando a clínica tenta manter mais do que o plano permite', async () => {
    const { useCase, prisma } = makeUseCase({ maxProfessionals: 1 });

    await expect(
      useCase.execute({
        tenantId: TENANT_ID,
        keepProfessionalIds: ['p1', 'p2'],
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.professional.updateMany).not.toHaveBeenCalled();
  });

  /**
   * Um id que não é da clínica (ou já inativo) entraria na conta de "quantos
   * ficam" e a clínica sairia daqui ainda acima do teto, achando que
   * resolveu.
   */
  it('recusa id que não é de profissional ativo desta clínica', async () => {
    const { useCase, prisma } = makeUseCase();

    await expect(
      useCase.execute({
        tenantId: TENANT_ID,
        keepProfessionalIds: ['de-outra-clinica'],
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.professional.updateMany).not.toHaveBeenCalled();
  });

  /**
   * Mesma regra da remoção: desativar quem tem paciente marcado deixaria
   * consultas órfãs — o profissional some da agenda e o paciente aparece na
   * clínica no dia.
   */
  it('recusa desativar quem tem agendamento futuro', async () => {
    const { useCase, prisma } = makeUseCase({
      comAgendaFutura: [{ professionalId: 'p2', _count: { _all: 3 } }],
    });

    await expect(
      useCase.execute({ tenantId: TENANT_ID, keepProfessionalIds: ['p1'] }),
    ).rejects.toThrow(ConflictException);
    expect(prisma.professional.updateMany).not.toHaveBeenCalled();
  });

  it('diz quem tem agenda e quantos agendamentos, para a clínica saber o que resolver', async () => {
    const { useCase } = makeUseCase({
      comAgendaFutura: [{ professionalId: 'p2', _count: { _all: 3 } }],
    });

    await expect(
      useCase.execute({ tenantId: TENANT_ID, keepProfessionalIds: ['p1'] }),
    ).rejects.toThrow(/Dr\. Bruno \(3\)/);
  });

  it('não faz nada quando todo mundo já está na lista de quem fica', async () => {
    const { useCase, prisma } = makeUseCase({ maxProfessionals: 8 });

    const result = await useCase.execute({
      tenantId: TENANT_ID,
      keepProfessionalIds: ['p1', 'p2', 'p3'],
    });

    expect(result).toEqual({ deactivated: 0 });
    expect(prisma.professional.updateMany).not.toHaveBeenCalled();
  });

  /** Ids repetidos no payload não podem consumir duas vagas. */
  it('ignora ids duplicados na contagem do limite', async () => {
    const { useCase } = makeUseCase({ maxProfessionals: 1 });

    const result = await useCase.execute({
      tenantId: TENANT_ID,
      keepProfessionalIds: ['p1', 'p1'],
    });

    expect(result).toEqual({ deactivated: 2 });
  });
});
