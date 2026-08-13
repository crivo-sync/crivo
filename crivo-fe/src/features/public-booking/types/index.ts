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
