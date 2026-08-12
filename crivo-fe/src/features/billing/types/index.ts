export type Plan = {
  id: string;
  key: string;
  name: string;
  priceInCents: number;
  /** `null` = sem limite (planos maiores), não "zero profissionais". */
  maxProfessionals: number | null;
  hasPrediction: boolean;
  hasAiMessages: boolean;
  hasWaitlist: boolean;
  hasDashboard: boolean;
  hasMedicalRecords: boolean;
  isActive: boolean;
};

export type CheckoutSession = {
  url: string;
};

export type ActionResult<T = undefined> =
  | { success: true; message: string; data: T }
  | { success: false; message: string; data?: undefined };
