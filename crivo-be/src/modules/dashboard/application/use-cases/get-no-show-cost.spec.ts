import { AppointmentStatus } from '@prisma/client';

import type { AppointmentRepository } from 'src/modules/appointments/domain/repository/appointment.repository';
import { GetNoShowCostUseCase } from './get-no-show-cost.use-case';

const TENANT_ID = 'tenant-1';

type Fake = {
  status: AppointmentStatus;
  priceInCents: number;
  confirmedAt: Date | null;
};

function makeUseCase(appointments: Fake[]) {
  const repository = {
    findMany: jest.fn().mockResolvedValue({ data: appointments, total: appointments.length }),
  } as unknown as AppointmentRepository;

  return new GetNoShowCostUseCase(repository);
}

const noShow = (price: number): Fake => ({
  status: AppointmentStatus.NO_SHOW,
  priceInCents: price,
  confirmedAt: null,
});

const completed = (price: number, confirmed = false): Fake => ({
  status: AppointmentStatus.COMPLETED,
  priceInCents: price,
  confirmedAt: confirmed ? new Date() : null,
});

describe('GetNoShowCostUseCase', () => {
  it('soma o preço das faltas — é a pergunta do dono da clínica', async () => {
    const useCase = makeUseCase([noShow(15000), noShow(20000), completed(30000)]);

    const result = await useCase.execute(TENANT_ID);

    expect(result.lostInCents).toBe(35000);
    expect(result.noShowCount).toBe(2);
  });

  it('a taxa considera só desfecho conhecido', async () => {
    const useCase = makeUseCase([
      noShow(10000),
      completed(10000),
      completed(10000),
      // `SCHEDULED` ainda não aconteceu: contá-lo como presença inflaria a
      // taxa a favor do produto.
      { status: AppointmentStatus.SCHEDULED, priceInCents: 10000, confirmedAt: null },
    ]);

    const result = await useCase.execute(TENANT_ID);

    expect(result.finishedCount).toBe(3);
    expect(result.noShowRate).toBeCloseTo(1 / 3);
  });

  it('mês sem desfecho devolve taxa null, não zero', async () => {
    const useCase = makeUseCase([
      { status: AppointmentStatus.SCHEDULED, priceInCents: 10000, confirmedAt: null },
    ]);

    // 0% diria "nenhum paciente falta aqui", o que é uma afirmação sobre a
    // clínica que o dado não sustenta.
    await expect(useCase.execute(TENANT_ID)).resolves.toMatchObject({
      noShowRate: null,
    });
  });

  it('"falta evitada" exige confirmação, não só comparecimento', async () => {
    const useCase = makeUseCase([
      completed(20000, true), // confirmou pelo WhatsApp e veio
      completed(50000, false), // veio, mas nunca respondeu
    ]);

    const result = await useCase.execute(TENANT_ID);

    // Sem `confirmedAt` seria só "veio à consulta" — aconteceria com ou sem
    // o Crivo, e creditar isso ao produto seria propaganda enganosa.
    expect(result.savedCount).toBe(1);
    expect(result.savedInCents).toBe(20000);
  });

  it('mês vazio não quebra', async () => {
    const useCase = makeUseCase([]);

    await expect(useCase.execute(TENANT_ID)).resolves.toEqual({
      lostInCents: 0,
      noShowCount: 0,
      finishedCount: 0,
      noShowRate: null,
      savedCount: 0,
      savedInCents: 0,
    });
  });
});
