import { Inject, Injectable } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';

import {
  APPOINTMENT_REPOSITORY,
  type AppointmentRepository,
  type AppointmentWithRelations,
} from 'src/modules/appointments/domain/repository/appointment.repository';

const ANALYTICS_WINDOW_DAYS = 7;
/** Faturamento olha mais longe que os outros gráficos — ver comentário no `execute`. */
const DEFAULT_REVENUE_WINDOW_DAYS = 30;
/** Teto de segurança — uma clínica não passa disso na janela usada aqui. */
const MAX_APPOINTMENTS_IN_WINDOW = 1000;

/** Início do dia N-1 dias atrás (a janela inclui hoje). */
function startOfDaysAgo(reference: Date, days: number): Date {
  const date = new Date(reference);
  date.setDate(date.getDate() - (days - 1));
  date.setHours(0, 0, 0, 0);
  return date;
}

const STATUS_ORDER: AppointmentStatus[] = [
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.COMPLETED,
  AppointmentStatus.CANCELLED,
  AppointmentStatus.NO_SHOW,
];

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

@Injectable()
export class GetDashboardAnalyticsUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: AppointmentRepository,
  ) {}

  async execute(tenantId: string, revenueDays = DEFAULT_REVENUE_WINDOW_DAYS) {
    const now = new Date();
    const windowStart = startOfDaysAgo(now, ANALYTICS_WINDOW_DAYS);

    // O faturamento tem janela própria (e maior por padrão): "concluídos nos
    // últimos 7 dias" volta vazio em clínica de movimento baixo, o que fazia o
    // gráfico parecer quebrado mesmo com atendimentos concluídos na agenda.
    //
    // Como a janela dos gráficos está SEMPRE contida na do faturamento, uma
    // única busca na maior serve as duas: filtrar em memória custa nada perto
    // de um segundo round-trip com os mesmos joins.
    const revenueStart = startOfDaysAgo(
      now,
      Math.max(ANALYTICS_WINDOW_DAYS, revenueDays),
    );

    const { data: revenueAppointments } =
      await this.appointmentRepository.findMany({
        tenantId,
        from: revenueStart,
        to: now,
        page: 1,
        perPage: MAX_APPOINTMENTS_IN_WINDOW,
      });

    const appointments = revenueAppointments.filter(
      (appointment) => appointment.startsAt >= windowStart,
    );

    return {
      byStatus: this.groupByStatus(appointments),
      byDay: this.groupByDay(appointments, windowStart, now),
      revenueByProcedure: this.groupRevenueByProcedure(revenueAppointments),
      revenueDays,
    };
  }

  private groupByStatus(appointments: AppointmentWithRelations[]) {
    const counts = new Map<AppointmentStatus, number>();
    for (const appointment of appointments) {
      counts.set(appointment.status, (counts.get(appointment.status) ?? 0) + 1);
    }

    return STATUS_ORDER.map((status) => ({
      status,
      count: counts.get(status) ?? 0,
    }));
  }

  private groupByDay(
    appointments: AppointmentWithRelations[],
    windowStart: Date,
    windowEnd: Date,
  ) {
    const counts = new Map<string, number>();
    for (const appointment of appointments) {
      const key = dateKey(appointment.startsAt);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    // Preenche todos os dias da janela, mesmo sem agendamento, pro gráfico
    // não pular datas — um dia vazio é informação (nenhum agendamento),
    // não deveria "sumir" do eixo X.
    const days: { date: string; count: number }[] = [];
    const cursor = new Date(windowStart);
    while (cursor <= windowEnd) {
      const key = dateKey(cursor);
      days.push({ date: key, count: counts.get(key) ?? 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    return days;
  }

  private groupRevenueByProcedure(appointments: AppointmentWithRelations[]) {
    const revenue = new Map<string, { name: string; totalInCents: number }>();

    for (const appointment of appointments) {
      if (appointment.status !== AppointmentStatus.COMPLETED) continue;

      const key = appointment.procedure.id;
      const existing = revenue.get(key);
      if (existing) {
        existing.totalInCents += appointment.priceInCents;
      } else {
        revenue.set(key, {
          name: appointment.procedure.name,
          totalInCents: appointment.priceInCents,
        });
      }
    }

    return Array.from(revenue.values()).sort(
      (a, b) => b.totalInCents - a.totalInCents,
    );
  }
}
