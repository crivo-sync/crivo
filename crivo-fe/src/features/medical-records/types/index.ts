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

export type ClinicalPhotoKind = "BEFORE" | "AFTER";

/**
 * Foto clínica de um atendimento.
 *
 * `url` e `thumbnailUrl` são **temporárias** (assinadas, ~5 min): o backend
 * as gera a cada leitura e nunca as guarda. Não vale cachear nem salvar —
 * depois de expirar, deixam de abrir.
 */
export type ClinicalPhoto = {
  id: string;
  kind: ClinicalPhotoKind;
  caption: string | null;
  createdAt: string;
  uploadedBy: string;
  url: string;
  thumbnailUrl: string;
  /** A galeria agrupa por atendimento — é o que conta a história do tratamento. */
  appointment: {
    id: string;
    startsAt: string;
    procedure: string;
  };
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
