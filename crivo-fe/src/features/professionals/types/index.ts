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
  /**
   * Grade semanal (0=domingo … 6=sábado, minutos desde a meia-noite).
   * Opcional porque o backend só passou a devolver junto com a listagem —
   * versões antigas do servidor não enviam o campo, e ausência significa a
   * mesma coisa que array vazio: atende no expediente da clínica.
   */
  schedules?: {
    weekday: number;
    startMinutes: number;
    endMinutes: number;
  }[];
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
