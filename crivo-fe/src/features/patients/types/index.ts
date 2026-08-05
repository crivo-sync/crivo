export type Patient = {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  cpf: string | null;
  email: string | null;
  createdAt: string;
  updatedAt: string;
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

export type ImportRowIssue = {
  /** Linha no arquivo, contando o cabeçalho — é o que a pessoa vê no Excel. */
  line: number;
  name: string | null;
  message: string;
};

export type ImportPreviewRow = {
  name: string;
  phone: string;
  cpf: string | null;
  email: string | null;
};

export type ImportResult = {
  /** true = simulação; nada foi gravado. */
  dryRun: boolean;
  totalRows: number;
  created: number;
  preview: ImportPreviewRow[];
  duplicates: ImportRowIssue[];
  errors: ImportRowIssue[];
};
