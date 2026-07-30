import { ValidationError } from '@nestjs/common';

/**
 * O class-validator só emite mensagens em inglês. Como o produto é PT-BR e
 * essas mensagens chegam direto na tela do usuário, traduzimos por constraint.
 * DTOs que precisam de texto específico continuam passando `message` no
 * próprio decorator — aquele tem prioridade e não passa por aqui.
 */
const TRANSLATIONS: Record<
  string,
  (property: string, args?: string) => string
> = {
  isNotEmpty: (p) => `${p} é obrigatório`,
  isDefined: (p) => `${p} é obrigatório`,
  isString: (p) => `${p} deve ser um texto`,
  isInt: (p) => `${p} deve ser um número inteiro`,
  isNumber: (p) => `${p} deve ser um número`,
  isBoolean: (p) => `${p} deve ser verdadeiro ou falso`,
  isDate: (p) => `${p} deve ser uma data válida`,
  isEmail: () => 'Informe um e-mail válido',
  isUuid: (p) => `${p} deve ser um identificador válido`,
  isEnum: (p) => `${p} tem um valor inválido`,
  minLength: (p, args) => `${p} deve ter ao menos ${args} caracteres`,
  maxLength: (p, args) => `${p} deve ter no máximo ${args} caracteres`,
  min: (p, args) => `${p} deve ser maior ou igual a ${args}`,
  max: (p, args) => `${p} deve ser menor ou igual a ${args}`,
  isHexColor: (p) => `${p} deve ser uma cor no formato #RRGGBB`,
  isUrl: (p) => `${p} deve ser uma URL válida`,
  whitelistValidation: (p) => `${p} não é um campo permitido`,
};

/** Nomes técnicos → rótulos que o usuário reconhece. */
const FIELD_LABELS: Record<string, string> = {
  name: 'O nome',
  tenantName: 'O nome da clínica',
  subdomain: 'O identificador da clínica',
  email: 'O e-mail',
  password: 'A senha',
  phone: 'O telefone',
  cpf: 'O CPF',
  specialty: 'A especialidade',
  councilCode: 'O registro do conselho',
  description: 'A descrição',
  durationMinutes: 'A duração',
  priceInCents: 'O preço',
  notes: 'As observações',
  status: 'O status',
  startsAt: 'A data de início',
  cancelReason: 'O motivo do cancelamento',
  patientId: 'O paciente',
  professionalId: 'O profissional',
  procedureId: 'O procedimento',
  role: 'O perfil de acesso',
  isActive: 'O status de ativação',
  page: 'A página',
  perPage: 'O total por página',
  search: 'A busca',
};

function labelFor(property: string): string {
  return FIELD_LABELS[property] ?? `O campo ${property}`;
}

/** Extrai o parâmetro numérico da mensagem original (ex: "at least 8"). */
function extractArg(originalMessage: string): string | undefined {
  return /(\d+)/.exec(originalMessage)?.[1];
}

function translateError(error: ValidationError): string[] {
  const messages: string[] = [];

  for (const [constraint, originalMessage] of Object.entries(
    error.constraints ?? {},
  )) {
    const translate = TRANSLATIONS[constraint];

    // Mensagem customizada no DTO já vem em português: o class-validator a
    // devolve no lugar da padrão, então detectamos comparando com o texto
    // gerado automaticamente (que sempre começa com o nome da propriedade).
    const isCustom = !originalMessage.startsWith(error.property);

    if (isCustom || !translate) {
      messages.push(originalMessage);
      continue;
    }

    messages.push(
      translate(labelFor(error.property), extractArg(originalMessage)),
    );
  }

  for (const child of error.children ?? []) {
    messages.push(...translateError(child));
  }

  return messages;
}

export function translateValidationErrors(errors: ValidationError[]): string[] {
  return errors.flatMap(translateError);
}
