export type WaitlistStatus = "WAITING" | "OFFERED" | "SCHEDULED" | "CANCELLED";

export type WaitlistEntry = {
  id: string;
  status: WaitlistStatus;
  /** `null` = aceita qualquer profissional. */
  professionalId: string | null;
  preferredFrom: string | null;
  preferredTo: string | null;
  notes: string | null;
  offeredAt: string | null;
  createdAt: string;
  patient: { id: string; name: string; phone: string };
  professional: { id: string; name: string } | null;
  procedure: { id: string; name: string; durationMinutes: number };
};

export type WaitlistResponse = {
  data: WaitlistEntry[];
  total: number;
};

/** Sugestões da fila para uma vaga que abriu. */
export type SlotCandidatesResponse = {
  slot: {
    professionalId: string;
    procedureId: string;
    startsAt: string;
    endsAt: string;
  };
  candidates: WaitlistEntry[];
};

export type AddToWaitlistInput = {
  patientId: string;
  procedureId: string;
  professionalId?: string;
  preferredFrom?: string;
  preferredTo?: string;
  notes?: string;
};

export type ActionResult<T = undefined> =
  | { success: true; message: string; data: T }
  | { success: false; message: string; data?: undefined };
