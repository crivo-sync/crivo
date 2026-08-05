import { BadRequestException } from '@nestjs/common';

/**
 * Regras de upload de CSV, no mesmo espírito do `image-upload.ts`.
 *
 * A validação é pela **extensão**, não pelo MIME: o navegador manda coisas
 * diferentes para o mesmo `.csv` dependendo do sistema — no Windows com
 * Excel instalado vem `application/vnd.ms-excel`, em outros
 * `application/octet-stream`. Confiar no MIME recusaria arquivo legítimo, e
 * ele não é garantia de nada mesmo (quem envia escolhe o valor).
 *
 * O conteúdo é validado de verdade no parser, que é onde a decisão pode ser
 * tomada com informação real em vez de metadado.
 */

export const MAX_CSV_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

const ALLOWED_EXTENSIONS = ['.csv', '.txt'];

export function assertValidCsvUpload(
  file?: Express.Multer.File,
): asserts file is Express.Multer.File {
  if (!file) {
    throw new BadRequestException('Envie um arquivo CSV.');
  }

  const name = file.originalname.toLowerCase();

  if (!ALLOWED_EXTENSIONS.some((extension) => name.endsWith(extension))) {
    throw new BadRequestException(
      'O arquivo precisa ser .csv. No Excel, use "Salvar como" → "CSV".',
    );
  }

  if (file.size === 0) {
    throw new BadRequestException('O arquivo está vazio.');
  }

  if (file.size > MAX_CSV_SIZE_BYTES) {
    throw new BadRequestException('O arquivo precisa ter até 2MB.');
  }
}
