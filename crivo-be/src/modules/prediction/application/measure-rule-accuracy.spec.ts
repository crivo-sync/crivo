import { AppointmentStatus } from '@prisma/client';

import { MeasureRuleAccuracyUseCase } from './measure-rule-accuracy.use-case';

type Row = {
  id: string;
  patientId: string;
  startsAt: Date;
  createdAt: Date;
  confirmedAt: Date | null;
  status: AppointmentStatus;
};

/** Prisma falso: só o `findMany` que o use case usa. */
function useCaseWith(rows: Row[]) {
  const prisma = {
    appointment: { findMany: async () => rows },
  } as never;

  return new MeasureRuleAccuracyUseCase(prisma);
}

const dia = (offset: number) => {
  const d = new Date('2026-06-01T10:00:00Z');
  d.setDate(d.getDate() + offset);
  return d;
};

function row(over: Partial<Row> & { id: string }): Row {
  return {
    patientId: 'p-1',
    startsAt: dia(0),
    createdAt: dia(-3),
    confirmedAt: null,
    status: AppointmentStatus.COMPLETED,
    ...over,
  };
}

describe('MeasureRuleAccuracyUseCase', () => {
  it('não conclui nada sem atendimento concluído', async () => {
    const result = await useCaseWith([]).execute('t-1');

    expect(result.sample).toBe(0);
    expect(result.separates).toBeNull();
    expect(result.verdict).toMatch(/Ainda não há atendimentos/);
  });

  it('avisa que a amostra é pequena em vez de afirmar', async () => {
    // Com 3 casos, qualquer taxa é ruído — e apresentar "33% de falta" como
    // fato levaria a mudar peso com base em nada.
    const rows = [
      row({ id: 'a', status: AppointmentStatus.NO_SHOW }),
      row({ id: 'b' }),
      row({ id: 'c' }),
    ];

    const result = await useCaseWith(rows).execute('t-1');

    expect(result.sample).toBe(3);
    expect(result.verdict).toMatch(/Amostra pequena/);
  });

  it('calcula a taxa de falta geral', async () => {
    const rows = [
      row({ id: 'a', status: AppointmentStatus.NO_SHOW }),
      row({ id: 'b' }),
      row({ id: 'c' }),
      row({ id: 'd' }),
    ];

    const result = await useCaseWith(rows).execute('t-1');

    expect(result.baseRate).toBe(25);
  });

  describe('reconstrução do risco no passado', () => {
    it('não usa falta que aconteceu DEPOIS da consulta avaliada', async () => {
      // O ponto central da medição. A consulta de junho é avaliada sem saber
      // da falta de julho — senão a regra pareceria acertar o que não
      // poderia ter previsto.
      const rows = [
        row({ id: 'primeira', startsAt: dia(0), confirmedAt: dia(-1) }),
        row({
          id: 'segunda',
          startsAt: dia(30),
          status: AppointmentStatus.NO_SHOW,
        }),
      ];

      const semVazamento = await useCaseWith(rows).execute('t-1');

      // A mesma dupla, mas com a falta ANTES: agora o peso de "já faltou"
      // (+35) entra legitimamente na segunda consulta.
      const comFaltaAntes = await useCaseWith([
        row({
          id: 'primeira',
          startsAt: dia(0),
          status: AppointmentStatus.NO_SHOW,
        }),
        row({ id: 'segunda', startsAt: dia(30) }),
      ]).execute('t-1');

      const somaAlto = (r: { byLevel: { level: string; total: number }[] }) =>
        r.byLevel.find((l) => l.level === 'HIGH')!.total;

      // Se a falta futura vazasse, os dois cenários dariam o mesmo resultado.
      // A diferença é a prova de que a ordem no tempo está sendo respeitada.
      expect(somaAlto(semVazamento)).toBeLessThan(somaAlto(comFaltaAntes));
    });

    it('conta a falta anterior quando ela realmente veio antes', async () => {
      const rows = [
        row({
          id: 'faltou',
          startsAt: dia(0),
          status: AppointmentStatus.NO_SHOW,
        }),
        row({ id: 'depois', startsAt: dia(30) }),
      ];

      const result = await useCaseWith(rows).execute('t-1');

      // A segunda consulta é do mesmo paciente e vem depois de uma falta:
      // tem de cair numa faixa de risco maior que a mínima.
      const low = result.byLevel.find((l) => l.level === 'LOW')!;
      expect(low.total).toBeLessThan(2);
    });

    it('ignora confirmação registrada depois da consulta', async () => {
      // `confirmedAt` posterior a `startsAt` é dado de correção retroativa —
      // naquele momento o paciente não tinha confirmado.
      const rows = [row({ id: 'a', startsAt: dia(0), confirmedAt: dia(5) })];

      const result = await useCaseWith(rows).execute('t-1');
      const semConfirmar = result.byLevel.find(
        (l) => l.level === 'MEDIUM' || l.level === 'HIGH',
      );

      expect(semConfirmar!.total).toBe(1);
    });
  });

  describe('separação', () => {
    it('é nula quando falta amostra em alguma ponta', async () => {
      // Responder `false` sugeriria que a regra falhou, quando ela nem
      // chegou a ser testada.
      const result = await useCaseWith([row({ id: 'a' })]).execute('t-1');

      expect(result.separates).toBeNull();
    });
  });
});
