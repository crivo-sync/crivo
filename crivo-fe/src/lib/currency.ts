/** Teto do campo de dinheiro: R$ 999.999,99 — acima disso é erro de digitação. */
export const MAX_PRICE_IN_CENTS = 99_999_999;

/** Formata centavos (inteiro, como o backend armazena) em R$ para exibição. */
export function formatCentsToBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

/**
 * Formata centavos para dentro de um campo de digitação — sem o "R$", que
 * fica no adornment do input.
 */
export function formatCentsForInput(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Lê o que foi digitado num campo de dinheiro: só os dígitos, preenchendo da
 * direita para a esquerda (o padrão de banco/maquininha). Digitar `3`, `0`,
 * `0`, `0`, `0` sobe o valor até R$ 300,00.
 *
 * A leitura por dígitos é o que faz o campo funcionar: interpretar o texto
 * como número decimal ("0,00" + tecla `3` = "0,003") arredondava tudo de
 * volta para zero e travava a digitação.
 */
export function parseInputToCents(
  value: string,
  maxCents: number = MAX_PRICE_IN_CENTS,
): number {
  const digits = value.replace(/\D/g, "").slice(0, 12);
  return Math.min(Number(digits || 0), maxCents);
}
