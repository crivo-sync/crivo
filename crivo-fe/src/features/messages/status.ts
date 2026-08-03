import type { MessageChannel, MessageStatus, MessageType } from "./types";

export const STATUS_LABELS: Record<MessageStatus, string> = {
  PENDING: "Pendente",
  SENT: "Enviada",
  DELIVERED: "Entregue",
  FAILED: "Falhou",
};

export const STATUS_COLORS: Record<
  MessageStatus,
  "default" | "info" | "success" | "error"
> = {
  PENDING: "default",
  SENT: "info",
  DELIVERED: "success",
  FAILED: "error",
};

export const CHANNEL_LABELS: Record<MessageChannel, string> = {
  WHATSAPP: "WhatsApp",
  SMS: "SMS",
};

export const TYPE_LABELS: Record<MessageType, string> = {
  APPOINTMENT_REMINDER: "Lembrete de agendamento",
  APPOINTMENT_CONFIRMATION_RECEIPT: "Confirmação de presença",
  MANUAL: "Manual",
};
