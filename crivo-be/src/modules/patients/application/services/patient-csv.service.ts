import { BadRequestException, Injectable } from '@nestjs/common';

import type { CsvRecord } from 'src/shared/csv/parse-csv';

/**
 * Sinônimos de cabeçalho aceitos. A planilha da clínica vem do sistema
 * antigo, da secretária ou de um export do WhatsApp — exigir um cabeçalho
 * exato transformaria a importação num "edite o arquivo antes", que é
 * justamente o trabalho que a função deveria poupar.
 *
 * A comparação é feita sobre o cabeçalho já normalizado (sem acento,
 * minúsculo), então "Telefone" e "TELEFONE" caem no mesmo lugar.
 */
const COLUMN_SYNONYMS = {
  name: ['nome', 'name', 'paciente', 'nome completo', 'nome do paciente'],
  phone: [
    'telefone',
    'phone',
    'celular',
    'fone',
    'telefone celular',
    'whatsapp',
    'contato',
    'telefone 1',
  ],
  cpf: ['cpf', 'documento', 'doc'],
  email: ['email', 'e-mail', 'e mail'],
} as const;

export type ResolvedColumns = {
  name: number;
  phone: number;
  cpf: number | null;
  email: number | null;
};

export type ExtractedPatient = {
  line: number;
  name: string;
  phone: string;
  cpf: string | null;
  email: string | null;
};

export type ExtractionError = {
  line: number;
  /** Mensagem pronta para a tela — quem lê é a recepção, não o dev. */
  message: string;
  /** Melhor esforço para a pessoa reconhecer a linha na planilha. */
  name: string | null;
};

/** Nome do paciente é obrigatório e precisa parecer um nome. */
const MIN_NAME_LENGTH = 2;

@Injectable()
export class PatientCsvService {
  /**
   * Descobre em que coluna está cada campo. Falha cedo e explicando o que
   * faltou: um arquivo sem telefone não tem conserto linha a linha.
   */
  resolveColumns(headers: string[]): ResolvedColumns {
    const find = (synonyms: readonly string[]) => {
      const index = headers.findIndex((header) => synonyms.includes(header));
      return index === -1 ? null : index;
    };

    const name = find(COLUMN_SYNONYMS.name);
    const phone = find(COLUMN_SYNONYMS.phone);

    const missing: string[] = [];
    if (name === null) missing.push('nome');
    if (phone === null) missing.push('telefone');

    if (missing.length > 0) {
      const alvo =
        missing.length === 1
          ? `a coluna ${missing[0]}`
          : `as colunas ${missing.join(' e ')}`;

      throw new BadRequestException(
        `O arquivo precisa ter ${alvo}. ` +
          `Cabeçalhos encontrados: ${headers.join(', ') || '(nenhum)'}.`,
      );
    }

    return {
      name: name as number,
      phone: phone as number,
      cpf: find(COLUMN_SYNONYMS.cpf),
      email: find(COLUMN_SYNONYMS.email),
    };
  }

  /**
   * Valida uma linha com as MESMAS regras do `CreatePatientDto`. Se divergir,
   * a clínica consegue importar um paciente que o formulário recusaria (ou o
   * contrário), e a diferença só aparece muito depois.
   */
  extract(
    record: CsvRecord,
    columns: ResolvedColumns,
  ): ExtractedPatient | ExtractionError {
    const cell = (index: number | null) =>
      index === null ? '' : (record.cells[index] ?? '').trim();

    const name = cell(columns.name).replace(/\s+/g, ' ');
    const rawPhone = cell(columns.phone);
    const phone = normalizePhone(rawPhone);
    const cpf = normalizeDigits(cell(columns.cpf));
    const email = cell(columns.email).toLowerCase();

    const fail = (message: string): ExtractionError => ({
      line: record.line,
      message,
      name: name || null,
    });

    if (name.length < MIN_NAME_LENGTH) {
      return fail(
        name ? `Nome muito curto ("${name}").` : 'Nome está em branco.',
      );
    }

    if (!phone) {
      return fail(
        rawPhone
          ? `Telefone inválido ("${rawPhone}") — precisa de DDD + número.`
          : 'Telefone está em branco.',
      );
    }

    if (cpf && cpf.length !== 11) {
      return fail(
        `CPF inválido ("${cell(columns.cpf)}") — precisa ter 11 dígitos.`,
      );
    }

    if (email && !isEmail(email)) {
      return fail(`E-mail inválido ("${email}").`);
    }

    return {
      line: record.line,
      name,
      phone,
      cpf: cpf || null,
      email: email || null,
    };
  }

  /**
   * Chave de duplicidade: CPF quando existe (é o que o banco garante único),
   * senão telefone. Sem o fallback, reimportar a mesma planilha de uma
   * clínica que não guarda CPF duplicaria a base inteira.
   */
  dedupeKey(patient: { cpf: string | null; phone: string }): string {
    return patient.cpf ? `cpf:${patient.cpf}` : `phone:${patient.phone}`;
  }
}

/** Só dígitos — a planilha traz "111.222.333-44", "(11) 98765-4321" etc. */
function normalizeDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Devolve o telefone em 10-11 dígitos, ou string vazia se não der.
 *
 * O `55` inicial só é removido quando sobra um número válido (12 ou 13
 * dígitos no total). Um número de 11 dígitos é deixado em paz mesmo
 * começando com 55 — **55 é o DDD de Santa Maria/RS**, e cortá-lo
 * transformaria um telefone gaúcho válido em lixo.
 */
function normalizePhone(value: string): string {
  let digits = normalizeDigits(value);

  if (digits.length >= 12 && digits.length <= 13 && digits.startsWith('55')) {
    digits = digits.slice(2);
  }

  return /^\d{10,11}$/.test(digits) ? digits : '';
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
