/**
 * `(11) 98765-4321` enquanto digita.
 *
 * Formatador próprio em vez do `PHONE_MASK` de `lib/br-masks.ts`: aquele é
 * feito para o `MaskedTextField` (MUI + react-imask), e esta página é
 * Tailwind puro, sem MUI. O backend recebe só os dígitos (`onlyDigits`).
 */
export function formatPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;

  // Celular (11 dígitos) quebra em 5+4; fixo (10) em 4+4.
  const cut = digits.length > 10 ? 7 : 6;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, cut)}-${digits.slice(cut)}`;
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** O backend exige 10 (fixo) ou 11 (celular) dígitos. */
export function isValidPhone(value: string): boolean {
  const digits = onlyDigits(value);
  return digits.length === 10 || digits.length === 11;
}
