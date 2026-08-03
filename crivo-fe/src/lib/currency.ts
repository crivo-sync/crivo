/** Formata centavos (inteiro, como o backend armazena) em R$ para exibição. */
export function formatCentsToBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

/** Converte um valor em reais (form, ponto ou vírgula) para centavos. */
export function parseBRLToCents(value: string | number): number {
  if (typeof value === "number") return Math.round(value * 100);
  const normalized = value.replace(/\./g, "").replace(",", ".");
  return Math.round(parseFloat(normalized || "0") * 100);
}
