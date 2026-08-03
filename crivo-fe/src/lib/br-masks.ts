/**
 * Máscaras e formatadores de padrões brasileiros comuns (telefone, CPF).
 * Usados tanto na digitação (react-imask) quanto na exibição em tabelas.
 */

/**
 * Celular (11 dígitos) ou fixo (10 dígitos). O `dispatch` padrão do imask
 * escolhe a máscara pelo "peso" de dígitos já aceitos e MANTÉM a escolha
 * anterior (`currentMask`) — sem sobrescrevê-lo, digitar um celular (DDD +
 * 9 dígitos) trava na máscara de fixo assim que os 10 primeiros dígitos
 * entram, cortando o último dígito do número (bug real, reproduzido
 * digitando 11987654321 → virava "(11) 93333-2222", 10 dígitos).
 *
 * `dispatch` precisa retornar uma instância JÁ COMPILADA de
 * `dynamicMasked.compiledMasks` (não a definição crua `{ mask: "..." }`) —
 * é isso que o `MaskedDynamic._update` monta a partir do array `mask` e é
 * o que `_applyDispatch` espera poder chamar `.reset()` em cima.
 *
 * `dispatch` é opção IRMÃ de `mask` no objeto de options do imask — não um
 * wrapper `{ mask: [...], dispatch }` aninhado (isso faz `maskedClass()`
 * não reconhecer o formato e cair em passthrough sem máscara nenhuma).
 */
export const PHONE_MASK = {
  mask: [{ mask: "(00) 0000-0000" }, { mask: "(00) 00000-0000" }],
  dispatch: (
    appended: string,
    dynamicMasked: { rawInputValue: string; compiledMasks: { mask: string }[] },
  ) => {
    const digits = (dynamicMasked.rawInputValue + appended).replace(/\D/g, "");
    return digits.length > 10
      ? dynamicMasked.compiledMasks[1]
      : dynamicMasked.compiledMasks[0];
  },
};

export const CPF_MASK = "000.000.000-00";

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  const isMobile = rest.length === 9;
  const middle = isMobile ? rest.slice(0, 5) : rest.slice(0, 4);
  const end = isMobile ? rest.slice(5) : rest.slice(4);
  return `(${ddd}) ${middle}-${end}`;
}

export function formatCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, "");
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}
