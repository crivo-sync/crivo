import type { Appointment, AppointmentStatus } from "@/features/appointments/types";
import type { Message } from "@/features/messages/types";

export type DashboardCounts = {
  appointmentsToday: number;
  upcomingUnconfirmed: number;
  failedMessages: number;
  patients: number;
  activeProfessionals: number;
  procedures: number;
};

export type DashboardSummary = {
  appointmentsToday: Appointment[];
  upcomingUnconfirmed: Appointment[];
  failedMessages: Message[];
  counts: DashboardCounts;
};

export type DashboardStatusCount = {
  status: AppointmentStatus;
  count: number;
};

export type DashboardDayCount = {
  date: string;
  count: number;
};

export type DashboardProcedureRevenue = {
  name: string;
  totalInCents: number;
};

/** Janelas oferecidas no filtro de faturamento — espelha o `IsIn` do backend. */
export const REVENUE_PERIOD_OPTIONS = [7, 30, 90] as const;

export type DashboardAnalytics = {
  byStatus: DashboardStatusCount[];
  byDay: DashboardDayCount[];
  revenueByProcedure: DashboardProcedureRevenue[];
  /** Janela efetivamente aplicada no faturamento (o backend decide o default). */
  revenueDays: number;
};

export type ActionResult<T = undefined> =
  | { success: true; message: string; data: T }
  | { success: false; message: string; data?: undefined };

/**
 * Quanto a falta custou no mês — a pergunta que o dono da clínica faz.
 *
 * `noShowRate` é `null` quando nenhum atendimento teve desfecho no mês: 0%
 * seria mentira, e o card diz isso em vez de fingir um número.
 */
export type NoShowCost = {
  lostInCents: number;
  noShowCount: number;
  finishedCount: number;
  noShowRate: number | null;
  savedCount: number;
  savedInCents: number;
};
