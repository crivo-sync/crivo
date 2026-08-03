export type MessageChannel = "WHATSAPP" | "SMS";

export type MessageType =
  | "APPOINTMENT_REMINDER"
  | "APPOINTMENT_CONFIRMATION_RECEIPT"
  | "MANUAL";

export type MessageStatus = "PENDING" | "SENT" | "DELIVERED" | "FAILED";

export type Message = {
  id: string;
  channel: MessageChannel;
  type: MessageType;
  status: MessageStatus;
  toPhone: string;
  body: string;
  attempts: number;
  lastError: string | null;
  sentAt: string | null;
  scheduledFor: string | null;
  createdAt: string;
  appointment: {
    id: string;
    startsAt: string;
    patient: { id: string; name: string; phone: string };
  } | null;
};

export type PaginationMeta = {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginationMeta;
};

export type ActionResult<T = undefined> =
  | { success: true; message: string; data: T }
  | { success: false; message: string; data?: undefined };
