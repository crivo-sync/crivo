/**
 * Parser de CSV sem dependência externa.
 *
 * Escrito à mão de propósito: o formato que chega de uma clínica é sempre o
 * mesmo punhado de casos (Excel em pt-BR, exportação de sistema antigo), e
 * eles cabem em ~100 linhas testáveis. Trocar isso por uma lib traria um
 * `package-lock` novo sem ganho proporcional.
 *
 * Cobre o que aparece na prática:
 * - aspas, aspas escapadas (`""`) e vírgula/quebra de linha dentro do campo
 * - CRLF (Windows) e LF
 * - BOM do Excel
 * - separador `;` (padrão do Excel em português) além de `,` e TAB
 * - arquivo em Latin-1, que é o que o Excel pt-BR gera por padrão
 */

/** Um registro do arquivo, já com a linha física de onde veio. */
export type CsvRecord = {
  /**
   * Linha no arquivo original, 1-based, contando o cabeçalho. É isso que
   * aparece na mensagem de erro — quem abre o CSV no Excel procura por
   * número de linha, não por índice do registro.
   */
  line: number;
  cells: string[];
};

export type ParsedCsv = {
  /** Cabeçalhos normalizados (minúsculo, sem acento). */
  headers: string[];
  records: CsvRecord[];
};

const DELIMITERS = [';', ',', '\t'] as const;

type Delimiter = (typeof DELIMITERS)[number];

/**
 * Excel em português gera Latin-1 por padrão, e um "José" lido como UTF-8
 * vira "Jos<?>". O caractere de substituição é o sinal de que os bytes
 * não eram UTF-8 válido — nesse caso relemos como Latin-1.
 */
export function decodeCsvBuffer(buffer: Buffer): string {
  const hasBom =
    buffer.length >= 3 &&
    buffer[0] === 0xef &&
    buffer[1] === 0xbb &&
    buffer[2] === 0xbf;

  // BOM é declaração explícita de UTF-8: respeita e não tenta adivinhar.
  if (hasBom) return buffer.subarray(3).toString('utf8');

  const utf8 = buffer.toString('utf8');

  return utf8.includes('\ufffd') ? buffer.toString('latin1') : utf8;
}

/**
 * Escolhe o separador contando ocorrências fora de aspas na primeira linha.
 * `;` ganha empate porque é o default do Excel pt-BR, que é a origem mais
 * provável de um arquivo com acento e vírgula decimal.
 */
export function detectDelimiter(text: string): Delimiter {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';

  let best: Delimiter = ',';
  let bestCount = 0;

  for (const delimiter of DELIMITERS) {
    let count = 0;
    let inQuotes = false;

    for (const char of firstLine) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === delimiter && !inQuotes) count++;
    }

    if (count > bestCount) {
      best = delimiter;
      bestCount = count;
    }
  }

  return best;
}

/** Minúsculo, sem acento e sem espaço nas pontas — para casar cabeçalhos. */
export function normalizeHeader(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // marcas de acento separadas pelo NFD
    .trim()
    .toLowerCase();
}

function tokenize(text: string, delimiter: string): CsvRecord[] {
  const records: CsvRecord[] = [];

  let cells: string[] = [];
  let field = '';
  let inQuotes = false;
  let line = 1;
  let recordLine = 1;
  /** Linha só com separadores/espaço não vira registro — é linha em branco. */
  let hasContent = false;

  const endRecord = () => {
    cells.push(field);
    if (hasContent) records.push({ line: recordLine, cells });
    cells = [];
    field = '';
    hasContent = false;
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        // `""` dentro de aspas é uma aspa literal.
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
        continue;
      }
      // Quebra de linha dentro de aspas faz parte do campo, mas ainda avança
      // o contador — senão as linhas seguintes reportariam número errado.
      if (char === '\n') line++;
      field += char;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      hasContent = true;
      continue;
    }

    if (char === delimiter) {
      cells.push(field);
      field = '';
      hasContent = true;
      continue;
    }

    // \r sozinho some: trata CRLF sem precisar normalizar o texto antes.
    if (char === '\r') continue;

    if (char === '\n') {
      endRecord();
      line++;
      recordLine = line;
      continue;
    }

    if (char.trim() !== '') hasContent = true;
    field += char;
  }

  // Arquivo que não termina em quebra de linha ainda tem um registro pendente.
  endRecord();

  return records;
}

/**
 * Devolve cabeçalhos normalizados + registros. Não valida nada de negócio:
 * quem conhece as regras de paciente é o `PatientCsvService`.
 */
export function parseCsv(text: string): ParsedCsv {
  const delimiter = detectDelimiter(text);
  const records = tokenize(text, delimiter);

  if (records.length === 0) return { headers: [], records: [] };

  const [header, ...rest] = records;

  return {
    headers: header.cells.map(normalizeHeader),
    records: rest,
  };
}
