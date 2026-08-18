export type BookingClinic = {
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  /** Minutos desde a meia-noite. */
  businessHoursStart: number;
  businessHoursEnd: number;
  /** `Date.getDay()`: 0 = domingo … 6 = sábado. */
  businessDays: number[];
};

export type BookingProfessional = {
  id: string;
  name: string;
  specialty: string | null;
  /** Lista vazia = atende todos os procedimentos da clínica. */
  procedures: { id: string }[];
  /**
   * Dias da semana em que o profissional atende, pela grade cadastrada no
   * admin (`Date.getDay()`: 0 = domingo … 6 = sábado).
   *
   * Lista vazia = profissional **sem grade**, atende no expediente da
   * clínica — a mesma regra do backend (`ProfessionalAvailabilityService`).
   * Por isso o front não pode ler "vazio" como "não atende em dia nenhum".
   */
  schedules: { weekday: number }[];
};

export type BookingProcedure = {
  id: string;
  name: string;
  durationMinutes: number;
  priceInCents: number;
};

export type BookingOptions = {
  clinic: BookingClinic;
  professionals: BookingProfessional[];
  procedures: BookingProcedure[];
  /**
   * A clínica está com uma pendência que faz o backend recusar agendamento
   * novo (hoje: mais profissionais ativos do que o plano permite).
   *
   * Booleano **sem motivo** de propósito: o paciente não deve saber que é
   * pendência de plano da clínica — é informação comercial interna, e ele
   * não pode fazer nada a respeito. Serve só para a página avisar
   * "indisponível, ligue para a clínica" antes de ele escolher horário e
   * digitar os dados.
   */
  bookingBlocked?: boolean;
};

export type Slot = {
  startsAt: string;
  endsAt: string;
};

export type Availability = {
  date: string;
  durationMinutes: number;
  slots: Slot[];
  /** A clínica não abre nesse dia (ou o profissional não atende). */
  closed: boolean;
  /** Explica por que a lista veio vazia num dia que a clínica abre. */
  noSlotsReason?: string | null;
};

export type BookingRequest = {
  patientName: string;
  patientPhone: string;
  professionalId: string;
  procedureId: string;
  startsAt: string;
  notes?: string;
};

export type BookingConfirmation = {
  id: string;
  startsAt: string;
  endsAt: string;
  clinicName: string;
};

export type ActionResult<T = undefined> =
  | { success: true; message: string; data: T }
  | { success: false; message: string; data?: undefined };
