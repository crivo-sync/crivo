export type RecordAuthor = {
  id: string;
  name: string;
};

export type Anamnesis = {
  id: string;
  patientId: string;
  allergies: string | null;
  medications: string | null;
  conditions: string | null;
  observations: string | null;
  /** Quem preencheu por último — exigência de rastreabilidade do registro. */
  updatedBy: RecordAuthor | null;
  updatedAt: string;
};

export type ClinicalNote = {
  id: string;
  content: string;
  appointmentId: string | null;
  author: RecordAuthor;
  createdAt: string;
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
