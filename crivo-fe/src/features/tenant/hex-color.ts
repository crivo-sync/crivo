/**
 * Formato aceito para as cores da marca: `#RGB` ou `#RRGGBB`.
 *
 * Fica num arquivo só porque o schema (que decide se o formulário é válido) e
 * o `ColorField` (que decide se mostra o swatch) precisam concordar — com uma
 * cópia em cada, o campo mostrava um preview válido de um valor que o form
 * rejeitava.
 */
export const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
