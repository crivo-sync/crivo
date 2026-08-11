import { Injectable } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { assessNoShowRisk, type RiskLevel } from '../domain/no-show-risk';

export type LevelAccuracy = {
  level: RiskLevel;
  /** Quantos atendimentos caíram nesta faixa. */
  total: number;
  noShows: number;
  /** Falta observada, em %. É o número que valida (ou não) o peso da faixa. */
  observedRate: number;
};

export type RuleAccuracy = {
  /** Atendimentos com desfecho conhecido no período. */
  sample: number;
  /** Faltas no período, em %. */
  baseRate: number;
  byLevel: LevelAccuracy[];
  /**
   * A regra separa? `true` quando risco alto falta mais que risco baixo.
   * `null` quando falta amostra em alguma ponta para comparar.
   */
  separates: boolean | null;
  /** Leitura honesta do que esta amostra permite (ou não) concluir. */
  verdict: string;
};

/** Abaixo disto, qualquer conclusão é ruído. */
const MIN_SAMPLE = 30;
const MIN_PER_LEVEL = 10;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Compara o risco previsto com o que de fato aconteceu.
 *
 * Sem isto, os pesos de `RISK_FACTORS` são hipótese não testada: o produto
 * escalona lembrete e prioriza ligação com base em números que ninguém
 * verificou. Esta medição é o que transforma a regra em algo corrigível — e,
 * mais tarde, o rótulo limpo que um modelo estatístico precisaria.
 */
@Injectable()
export class MeasureRuleAccuracyUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(tenantId: string, days = 180): Promise<RuleAccuracy> {
    const since = new Date(Date.now() - days * MS_PER_DAY);

    // Só desfecho conhecido: `SCHEDULED` e `CONFIRMED` ainda não aconteceram,
    // e incluí-los como "não faltou" contaria o futuro a favor da regra.
    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        startsAt: { gte: since, lte: new Date() },
        status: {
          in: [AppointmentStatus.COMPLETED, AppointmentStatus.NO_SHOW],
        },
      },
      select: {
        id: true,
        patientId: true,
        startsAt: true,
        createdAt: true,
        confirmedAt: true,
        status: true,
      },
      orderBy: { startsAt: 'asc' },
    });

    const buckets = new Map<RiskLevel, { total: number; noShows: number }>([
      ['HIGH', { total: 0, noShows: 0 }],
      ['MEDIUM', { total: 0, noShows: 0 }],
      ['LOW', { total: 0, noShows: 0 }],
    ]);

    for (const appointment of appointments) {
      const level = this.riskAsOf(appointment, appointments);
      const bucket = buckets.get(level)!;

      bucket.total += 1;
      if (appointment.status === AppointmentStatus.NO_SHOW) {
        bucket.noShows += 1;
      }
    }

    const sample = appointments.length;
    const totalNoShows = appointments.filter(
      (a) => a.status === AppointmentStatus.NO_SHOW,
    ).length;

    const byLevel: LevelAccuracy[] = [...buckets.entries()].map(
      ([level, { total, noShows }]) => ({
        level,
        total,
        noShows,
        observedRate: total > 0 ? round(noShows / total) : 0,
      }),
    );

    return {
      sample,
      baseRate: sample > 0 ? round(totalNoShows / sample) : 0,
      byLevel,
      separates: this.separates(byLevel),
      verdict: this.verdict(sample, byLevel),
    };
  }

  /**
   * O risco **como era antes daquela consulta**.
   *
   * É a parte que faz a medição valer alguma coisa. Usar o histórico de hoje
   * seria trapaça: uma consulta de março seria avaliada sabendo das faltas de
   * abril em diante, e a regra pareceria muito melhor do que é. Só conta o
   * que já tinha acontecido **antes** de `startsAt`.
   */
  private riskAsOf(
    target: {
      patientId: string;
      startsAt: Date;
      createdAt: Date;
      confirmedAt: Date | null;
    },
    all: {
      patientId: string;
      startsAt: Date;
      status: AppointmentStatus;
    }[],
  ): RiskLevel {
    const previous = all.filter(
      (a) => a.patientId === target.patientId && a.startsAt < target.startsAt,
    );

    const previousNoShows = previous.filter(
      (a) => a.status === AppointmentStatus.NO_SHOW,
    ).length;
    const previousCompleted = previous.filter(
      (a) => a.status === AppointmentStatus.COMPLETED,
    ).length;

    return assessNoShowRisk({
      previousNoShows,
      previousCompleted,
      // `confirmedAt` posterior à consulta não conta: naquele momento ele
      // ainda não tinha confirmado.
      hasConfirmed:
        !!target.confirmedAt && target.confirmedAt < target.startsAt,
      isFirstVisit: previous.length === 0,
      hourOfDay: target.startsAt.getHours(),
      daysUntilAppointment: Math.round(
        (target.startsAt.getTime() - target.createdAt.getTime()) / MS_PER_DAY,
      ),
    }).level;
  }

  /** A regra separa quem falta de quem não falta? */
  private separates(byLevel: LevelAccuracy[]): boolean | null {
    const high = byLevel.find((l) => l.level === 'HIGH')!;
    const low = byLevel.find((l) => l.level === 'LOW')!;

    // Sem amostra nas duas pontas não há comparação possível — responder
    // `false` sugeriria que a regra falhou, quando ela nem foi testada.
    if (high.total === 0 || low.total === 0) return null;

    return high.observedRate > low.observedRate;
  }

  /**
   * O texto vem do backend, não da tela: quem lê o número precisa da mesma
   * ressalva em qualquer lugar que ele apareça.
   */
  private verdict(sample: number, byLevel: LevelAccuracy[]): string {
    if (sample === 0) {
      return 'Ainda não há atendimentos concluídos para medir.';
    }

    if (sample < MIN_SAMPLE) {
      return `Amostra pequena (${sample} atendimentos). Os números abaixo são indicação, não conclusão — com menos de ${MIN_SAMPLE} casos, um paciente a mais muda tudo.`;
    }

    const magros = byLevel.filter(
      (l) => l.total > 0 && l.total < MIN_PER_LEVEL,
    );

    if (magros.length > 0) {
      const nomes = magros.map((l) => LEVEL_LABELS[l.level]).join(' e ');
      return `Amostra suficiente no geral, mas ainda fina em ${nomes}. Trate essas faixas com reserva.`;
    }

    const high = byLevel.find((l) => l.level === 'HIGH')!;
    const low = byLevel.find((l) => l.level === 'LOW')!;

    if (high.observedRate > low.observedRate) {
      return `A regra está separando: quem foi classificado como risco alto faltou ${high.observedRate}%, contra ${low.observedRate}% do risco baixo.`;
    }

    return `⚠️ A regra não está separando: o risco alto faltou ${high.observedRate}%, contra ${low.observedRate}% do risco baixo. Os pesos precisam ser revistos.`;
  }
}

const LEVEL_LABELS: Record<RiskLevel, string> = {
  HIGH: 'risco alto',
  MEDIUM: 'risco médio',
  LOW: 'risco baixo',
};

const round = (value: number) => Math.round(value * 1000) / 10;
