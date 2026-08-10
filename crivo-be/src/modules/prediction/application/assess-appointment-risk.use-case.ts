import { Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import {
  assessNoShowRisk,
  type RiskAssessment,
} from '../domain/no-show-risk';

export type AppointmentRisk = RiskAssessment & {
  appointmentId: string;
  patientId: string;
  patientName: string;
  startsAt: Date;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Calcula o risco de falta dos agendamentos que ainda vão acontecer.
 *
 * Calculado sob demanda, não gravado: os sinais mudam sozinhos (o paciente
 * confirma, o horário se aproxima) e um score persistido ficaria velho sem
 * ninguém perceber. Quando a regra virar modelo e o cálculo ficar caro, aí
 * vale materializar — hoje é uma consulta e aritmética.
 */
@Injectable()
export class AssessAppointmentRiskUseCase {
  constructor(private readonly prisma: PrismaService) {}

  /** Risco de um agendamento específico. */
  async forAppointment(
    appointmentId: string,
    tenantId: string,
  ): Promise<AppointmentRisk> {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, tenantId },
      include: { patient: { select: { id: true, name: true } } },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado.');
    }

    const history = await this.historyFor(tenantId, [appointment.patientId]);

    return this.build(appointment, history);
  }

  /**
   * Agenda futura ordenada por risco.
   *
   * É a tela que responde "para quem eu ligo hoje?" — por isso ordena por
   * score, não por horário: a recepção tem tempo limitado e precisa começar
   * por quem tem mais chance de faltar.
   */
  async forUpcoming(
    tenantId: string,
    options: { days?: number; limit?: number } = {},
  ): Promise<AppointmentRisk[]> {
    const days = options.days ?? 7;
    const until = new Date(Date.now() + days * MS_PER_DAY);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        startsAt: { gte: new Date(), lte: until },
        // Só o que ainda pode ser salvo por uma ligação: cancelado e
        // concluído não têm ação possível.
        status: {
          in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
        },
      },
      include: { patient: { select: { id: true, name: true } } },
      orderBy: { startsAt: 'asc' },
    });

    if (appointments.length === 0) return [];

    // Histórico de todos os pacientes de uma vez: uma consulta por paciente
    // faria N+1 numa tela que lista a semana inteira.
    const history = await this.historyFor(
      tenantId,
      appointments.map((appointment) => appointment.patientId),
    );

    const assessed = appointments.map((appointment) =>
      this.build(appointment, history),
    );

    return assessed
      .sort((a, b) => b.score - a.score || a.startsAt.getTime() - b.startsAt.getTime())
      .slice(0, options.limit ?? 50);
  }

  /**
   * Faltas e comparecimentos anteriores, por paciente.
   *
   * `groupBy` em vez de contar por paciente: a diferença aparece já na
   * primeira clínica com agenda cheia.
   */
  private async historyFor(tenantId: string, patientIds: string[]) {
    const rows = await this.prisma.appointment.groupBy({
      by: ['patientId', 'status'],
      where: {
        tenantId,
        patientId: { in: patientIds },
        status: {
          in: [AppointmentStatus.NO_SHOW, AppointmentStatus.COMPLETED],
        },
      },
      _count: true,
    });

    const history = new Map<string, { noShows: number; completed: number }>();

    for (const row of rows) {
      const current = history.get(row.patientId) ?? { noShows: 0, completed: 0 };

      if (row.status === AppointmentStatus.NO_SHOW) {
        current.noShows = row._count;
      } else {
        current.completed = row._count;
      }

      history.set(row.patientId, current);
    }

    return history;
  }

  private build(
    appointment: {
      id: string;
      patientId: string;
      startsAt: Date;
      createdAt: Date;
      confirmedAt: Date | null;
      patient: { id: string; name: string };
    },
    history: Map<string, { noShows: number; completed: number }>,
  ): AppointmentRisk {
    const stats = history.get(appointment.patientId) ?? {
      noShows: 0,
      completed: 0,
    };

    const assessment = assessNoShowRisk({
      previousNoShows: stats.noShows,
      previousCompleted: stats.completed,
      hasConfirmed: !!appointment.confirmedAt,
      // Sem histórico de comparecimento nem de falta, este é o primeiro
      // contato — o `groupBy` acima só conta atendimentos que terminaram.
      isFirstVisit: stats.noShows + stats.completed === 0,
      hourOfDay: appointment.startsAt.getHours(),
      daysUntilAppointment: Math.round(
        (appointment.startsAt.getTime() - appointment.createdAt.getTime()) /
          MS_PER_DAY,
      ),
    });

    return {
      ...assessment,
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      patientName: appointment.patient.name,
      startsAt: appointment.startsAt,
    };
  }
}
