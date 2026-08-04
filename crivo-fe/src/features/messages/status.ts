import type { MessageChannel, MessageStatus, MessageType } from "./types";

export const STATUS_LABELS: Record<MessageStatus, string> = {
  PENDING: "Pendente",
  // Nunca chegou ao paciente: o agendamento foi remarcado antes de sair.
  CANCELLED: "Cancelada",
  SENT: "Enviada",
  DELIVERED: "Entregue",
  FAILED: "Falhou",
};

export const STATUS_COLORS: Record<
  MessageStatus,
  "default" | "info" | "success" | "error" | "warning"
> = {
  PENDING: "default",
  CANCELLED: "warning",
  SENT: "info",
  DELIVERED: "success",
  FAILED: "error",
};

export const CHANNEL_LABELS: Record<MessageChannel, string> = {
  WHATSAPP: "WhatsApp",
  SMS: "SMS",
};

export const TYPE_LABELS: Record<MessageType, string> = {
  APPOINTMENT_BOOKED: "Aviso de agendamento",
  APPOINTMENT_REMINDER: "Lembrete de agendamento",
  APPOINTMENT_CONFIRMATION_RECEIPT: "Confirmação de presença",
  MANUAL: "Manual",
};
