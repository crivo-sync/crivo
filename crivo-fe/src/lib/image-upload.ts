/**
 * Regras de upload de imagem compartilhadas por avatar de usuário e logo da
 * clínica. Antes de existirem aqui, o limite e a lista de tipos estavam
 * copiados em seis lugares (dois componentes, duas Server Actions e dois
 * controllers no backend) — mudar o limite exigia seis edições coordenadas, e
 * esquecer uma fazia o cliente aceitar um arquivo que o servidor recusaria.
 *
 * O backend continua sendo a autoridade final: valida de novo e rejeita o que
 * escapar daqui. Esta camada existe para falhar cedo, em português, sem gastar
 * o upload.
 */

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/** Usado no `accept` do `<input type="file">`. */
export const IMAGE_ACCEPT_ATTRIBUTE = ALLOWED_IMAGE_MIME_TYPES.join(",");

/**
 * Valida tipo e tamanho. Devolve a mensagem de erro pronta para exibir, ou
 * `null` quando o arquivo é aceitável.
 */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
    return "Envie uma imagem JPEG, PNG ou WebP.";
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "A imagem precisa ter até 5MB.";
  }
  return null;
}
