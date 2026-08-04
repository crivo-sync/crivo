import { BadRequestException } from '@nestjs/common';

/**
 * Regras de upload de imagem compartilhadas pelos endpoints que aceitam
 * arquivo (avatar do usuário, logo da clínica). Antes de existirem aqui, o
 * limite e a lista de tipos estavam repetidos em cada controller — mudar o
 * teto ou aceitar um formato novo exigia caçar todos os call sites, e cada
 * cópia era uma chance de divergir.
 */

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Valida o arquivo recebido via multipart e lança `BadRequestException` com a
 * mensagem pronta. O `file` é opcional de propósito: `@UploadedFile()` devolve
 * `undefined` quando a requisição não traz arquivo nenhum.
 */
export function assertValidImageUpload(
  file?: Express.Multer.File,
): asserts file is Express.Multer.File {
  if (!file) {
    throw new BadRequestException('Envie um arquivo de imagem.');
  }
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
    throw new BadRequestException('Envie uma imagem JPEG, PNG ou WebP.');
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new BadRequestException('A imagem precisa ter até 5MB.');
  }
}
