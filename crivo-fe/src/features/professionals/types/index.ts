export type Professional = {
  id: string;
  tenantId: string;
  name: string;
  specialty: string | null;
  councilCode: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: string;
  /** Procedimentos que este profissional realiza. Vazio = realiza todos. */
  procedures: { id: string; name: string }[];
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

/** Uma faixa de atendimento num dia da semana. Minutos desde a meia-noite. */
export type ScheduleWindow = {
  id?: string;
  /** 0=domingo … 6=sábado, igual a `Date.getDay()`. */
  weekday: number;
  startMinutes: number;
  endMinutes: number;
};

export type TimeOff = {
  id: string;
  startsAt: string;
  endsAt: string;
  reason: string | null;
};
