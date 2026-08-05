/**
 * Regras de upload de CSV, espelhando `csv-upload.ts` do crivo-be. Mesma
 * lógica do `image-upload.ts`: o backend continua sendo a autoridade — isto
 * existe só para falhar cedo, em português, sem gastar o upload.
 *
 * A checagem é por **extensão**, não por MIME, pelo mesmo motivo do backend:
 * o navegador manda `application/vnd.ms-excel`, `text/csv` ou
 * `application/octet-stream` para o mesmo `.csv`, dependendo do sistema.
 */

export const MAX_CSV_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

/** Usado no `accept` do `<input type="file">`. */
export const CSV_ACCEPT_ATTRIBUTE = ".csv,text/csv";

export function validateCsvFile(file: File): string | null {
  if (!/\.(csv|txt)$/i.test(file.name)) {
    return 'O arquivo precisa ser .csv. No Excel, use "Salvar como" → "CSV".';
  }
  if (file.size === 0) {
    return "O arquivo está vazio.";
  }
  if (file.size > MAX_CSV_SIZE_BYTES) {
    return "O arquivo precisa ter até 2MB.";
  }
  return null;
}
