export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

/** Por que o paciente recebeu este score — é o que torna a decisão auditável. */
export type RiskFactor = {
  code: string;
  label: string;
  points: number;
};

export type AppointmentRisk = {
  appointmentId: string;
  patientId: string;
  patientName: string;
  startsAt: string;
  score: number;
  level: RiskLevel;
  factors: RiskFactor[];
};

export type UpcomingRiskResponse = {
  data: AppointmentRisk[];
  /** Contagem por faixa — a recepção dimensiona o esforço do dia por aqui. */
  summary: { high: number; medium: number; low: number };
};

export type ActionResult<T = undefined> =
  | { success: true; message: string; data: T }
  | { success: false; message: string; data?: undefined };
