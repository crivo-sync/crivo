export type AppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type Appointment = {
  id: string;
  tenantId: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  priceInCents: number;
  notes: string | null;
  cancelReason: string | null;
  patient: { id: string; name: string; phone: string };
  professional: { id: string; name: string };
  procedure: { id: string; name: string; durationMinutes: number };
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
