import type { AppointmentStatus } from "./types";

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED: "Agendado",
  CONFIRMED: "Confirmado",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
  NO_SHOW: "Faltou",
};

export const STATUS_COLORS: Record<
  AppointmentStatus,
  "default" | "info" | "success" | "error" | "warning"
> = {
  SCHEDULED: "default",
  CONFIRMED: "info",
  COMPLETED: "success",
  CANCELLED: "error",
  NO_SHOW: "warning",
};
