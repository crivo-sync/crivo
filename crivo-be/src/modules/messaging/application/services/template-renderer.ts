/**
 * Marcadores que a clínica pode usar no texto. Em português porque quem
 * escreve o template é a recepção, não um desenvolvedor — `{{patientName}}`
 * seria uma barreira sem ganho nenhum.
 */
export const TEMPLATE_PLACEHOLDERS = {
  paciente: 'Primeiro nome do paciente',
  clinica: 'Nome da clínica',
  profissional: 'Quem vai atender',
  procedimento: 'Procedimento marcado',
  data: 'Data da consulta (dd/mm)',
  hora: 'Horário da consulta (hh:mm)',
  link: 'Link de confirmação de presença',
} as const;

export type TemplatePlaceholder = keyof typeof TEMPLATE_PLACEHOLDERS;

export type TemplateValues = Record<TemplatePlaceholder, string>;

/**
 * Marcadores sem os quais a mensagem perde a função.
 *
 * Um lembrete sem data/hora não lembra de nada, e sem link o paciente não
 * tem como confirmar — o produto inteiro depende dessa confirmação. Validar
 * na hora de salvar (e não no envio) é o que impede a clínica descobrir o
 * erro só quando o paciente não recebeu.
 */
export const REQUIRED_PLACEHOLDERS: TemplatePlaceholder[] = [
  'data',
  'hora',
  'link',
];

/** `{{ paciente }}`, `{{paciente}}` — espaço em volta é tolerado. */
const PLACEHOLDER_RE = /\{\{\s*(\w+)\s*\}\}/g;

/** Marcadores efetivamente usados no texto, sem repetir. */
export function usedPlaceholders(body: string): string[] {
  return [
    ...new Set(
      Array.from(body.matchAll(PLACEHOLDER_RE), (match) =>
        match[1].toLowerCase(),
      ),
    ),
  ];
}

/** Marcadores escritos no texto que não existem. Provavelmente erro de digitação. */
export function unknownPlaceholders(body: string): string[] {
  return usedPlaceholders(body).filter(
    (name) => !(name in TEMPLATE_PLACEHOLDERS),
  );
}

/** Dos obrigatórios, quais faltam. */
export function missingRequiredPlaceholders(body: string): string[] {
  const used = new Set(usedPlaceholders(body));

  return REQUIRED_PLACEHOLDERS.filter((name) => !used.has(name));
}

/**
 * Troca os marcadores pelos valores reais.
 *
 * Marcador desconhecido é removido em vez de mantido: deixar `{{telefone}}`
 * cru no texto faria o paciente receber uma mensagem visivelmente quebrada.
 * O caso já é barrado na validação ao salvar — isto é a segunda camada, para
 * template gravado antes de a validação existir.
 */
export function renderTemplate(body: string, values: TemplateValues): string {
  return body.replace(PLACEHOLDER_RE, (_, rawName: string) => {
    const name = rawName.toLowerCase() as TemplatePlaceholder;

    return values[name] ?? '';
  });
}
