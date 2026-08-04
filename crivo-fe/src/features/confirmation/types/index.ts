export type AppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

/** Espelha o retorno de `GET /c/:token` no crivo-be — só leitura. */
export type ConfirmationPreview = {
  alreadyConfirmed: boolean;
  clinic: string;
  patient: string;
  professional: string;
  procedure: string;
  startsAt: string;
  status: AppointmentStatus;
};

/** Espelha o retorno de `POST /c/:token/confirm`. */
export type ConfirmationResult = {
  alreadyConfirmed: boolean;
  status: AppointmentStatus;
};

export type ActionResult<T = undefined> =
  | { success: true; message: string; data: T }
  | { success: false; message: string; data?: undefined };
