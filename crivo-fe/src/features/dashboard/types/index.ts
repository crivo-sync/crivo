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

export type DashboardAnalytics = {
  byStatus: DashboardStatusCount[];
  byDay: DashboardDayCount[];
  revenueByProcedure: DashboardProcedureRevenue[];
};

export type ActionResult<T = undefined> =
  | { success: true; message: string; data: T }
  | { success: false; message: string; data?: undefined };
