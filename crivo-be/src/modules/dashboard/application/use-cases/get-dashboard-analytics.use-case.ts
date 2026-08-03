import { Inject, Injectable } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';

import {
  APPOINTMENT_REPOSITORY,
  type AppointmentRepository,
  type AppointmentWithRelations,
} from 'src/modules/appointments/domain/repository/appointment.repository';

const ANALYTICS_WINDOW_DAYS = 7;
/** Teto de segurança — uma clínica não passa disso em 7 dias na prática. */
const MAX_APPOINTMENTS_IN_WINDOW = 1000;

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

  async execute(tenantId: string) {
    const now = new Date();
    const windowStart = new Date(now);
    windowStart.setDate(windowStart.getDate() - (ANALYTICS_WINDOW_DAYS - 1));
    windowStart.setHours(0, 0, 0, 0);

    const { data: appointments } = await this.appointmentRepository.findMany({
      tenantId,
      from: windowStart,
      to: now,
      page: 1,
      perPage: MAX_APPOINTMENTS_IN_WINDOW,
    });

    return {
      byStatus: this.groupByStatus(appointments),
      byDay: this.groupByDay(appointments, windowStart, now),
      revenueByProcedure: this.groupRevenueByProcedure(appointments),
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
