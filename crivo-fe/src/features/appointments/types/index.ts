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

export type AvailabilitySlot = {
  startsAt: string;
  endsAt: string;
};

export type Availability = {
  date: string;
  /** Duração do procedimento escolhido — define o tamanho de cada horário. */
  durationMinutes: number;
  slots: AvailabilitySlot[];
  /** `true` quando a clínica não atende nesse dia da semana. */
  closed: boolean;
  /** Por que o dia está sem horários — só presente quando `slots` é vazio. */
  noSlotsReason?: NoSlotsReason;
  /** Grade do profissional para o dia consultado (minutos desde a meia-noite). */
  scheduleWindows: { startMinutes: number; endMinutes: number }[];
  /** Bloqueio que cobre o dia, se houver. */
  timeOff: { startsAt: string; endsAt: string; reason: string | null } | null;
};

export type NoSlotsReason =
  | "TIME_OFF"
  | "NOT_WORKING_DAY"
  | "WINDOW_PASSED"
  | "ALL_BUSY";

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
