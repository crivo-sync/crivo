import {
  decodeCsvBuffer,
  detectDelimiter,
  normalizeHeader,
  parseCsv,
} from './parse-csv';

describe('decodeCsvBuffer', () => {
  it('remove o BOM que o Excel escreve', () => {
    const buffer = Buffer.concat([
      Buffer.from([0xef, 0xbb, 0xbf]),
      Buffer.from('nome,telefone', 'utf8'),
    ]);

    expect(decodeCsvBuffer(buffer)).toBe('nome,telefone');
  });

  it('lê acento em UTF-8', () => {
    expect(decodeCsvBuffer(Buffer.from('José Antônio', 'utf8'))).toBe(
      'José Antônio',
    );
  });

  it('cai para Latin-1 quando os bytes não são UTF-8 válido', () => {
    // É exatamente o que o Excel pt-BR gera ao "Salvar como CSV".
    expect(decodeCsvBuffer(Buffer.from('José Antônio', 'latin1'))).toBe(
      'José Antônio',
    );
  });
});

describe('detectDelimiter', () => {
  it('reconhece ponto e vírgula (Excel pt-BR)', () => {
    expect(detectDelimiter('nome;telefone;cpf')).toBe(';');
  });

  it('reconhece vírgula', () => {
    expect(detectDelimiter('nome,telefone,cpf')).toBe(',');
  });

  it('reconhece TAB', () => {
    expect(detectDelimiter('nome\ttelefone\tcpf')).toBe('\t');
  });

  it('ignora separador que está dentro de aspas', () => {
    // Uma só vírgula real; a de dentro das aspas não conta.
    expect(detectDelimiter('"Souza, Ana";telefone')).toBe(';');
  });

  it('olha apenas a primeira linha', () => {
    expect(detectDelimiter('nome;telefone\nAna,Maria;11999998888')).toBe(';');
  });
});

describe('normalizeHeader', () => {
  it.each([
    ['Nome', 'nome'],
    ['  TELEFONE  ', 'telefone'],
    ['E-mail', 'e-mail'],
    ['Telefone Celular', 'telefone celular'],
    ['CPF', 'cpf'],
  ])('normaliza %s', (input, expected) => {
    expect(normalizeHeader(input)).toBe(expected);
  });
});

describe('parseCsv', () => {
  it('separa cabeçalho dos registros', () => {
    const result = parseCsv('nome,telefone\nAna,11999998888');

    expect(result.headers).toEqual(['nome', 'telefone']);
    expect(result.records).toEqual([
      { line: 2, cells: ['Ana', '11999998888'] },
    ]);
  });

  it('lida com CRLF do Windows', () => {
    const result = parseCsv('nome,telefone\r\nAna,11999998888\r\n');

    expect(result.records).toEqual([
      { line: 2, cells: ['Ana', '11999998888'] },
    ]);
  });

  it('mantém a vírgula que está dentro de aspas no mesmo campo', () => {
    const result = parseCsv('nome,telefone\n"Souza, Ana",11999998888');

    expect(result.records[0].cells).toEqual(['Souza, Ana', '11999998888']);
  });

  it('desescapa aspas duplicadas', () => {
    const result = parseCsv('nome\n"Ana ""Aninha"" Souza"');

    expect(result.records[0].cells).toEqual(['Ana "Aninha" Souza']);
  });

  it('aceita quebra de linha dentro de aspas sem perder a contagem', () => {
    const result = parseCsv('nome,obs\n"Ana","mora em\nSão Paulo"\nBruno,ok');

    expect(result.records[0].cells).toEqual(['Ana', 'mora em\nSão Paulo']);
    // Bruno está na 4ª linha física do arquivo, não na 3ª.
    expect(result.records[1]).toEqual({ line: 4, cells: ['Bruno', 'ok'] });
  });

  it('ignora linhas em branco sem desalinhar o número da linha', () => {
    const result = parseCsv(
      'nome,telefone\nAna,11999998888\n\n\nBruno,11888887777',
    );

    expect(result.records).toEqual([
      { line: 2, cells: ['Ana', '11999998888'] },
      { line: 5, cells: ['Bruno', '11888887777'] },
    ]);
  });

  it('não perde o último registro quando falta quebra de linha no fim', () => {
    const result = parseCsv('nome\nAna');

    expect(result.records).toHaveLength(1);
  });

  it('devolve vazio para arquivo sem conteúdo', () => {
    expect(parseCsv('')).toEqual({ headers: [], records: [] });
  });

  it('trata arquivo só com cabeçalho', () => {
    const result = parseCsv('nome,telefone\n');

    expect(result.headers).toEqual(['nome', 'telefone']);
    expect(result.records).toEqual([]);
  });

  it('preserva campos vazios em vez de encurtar a linha', () => {
    // Sem isso, um CPF em branco jogaria o e-mail para a coluna do CPF.
    const result = parseCsv('nome,cpf,email\nAna,,ana@email.com');

    expect(result.records[0].cells).toEqual(['Ana', '', 'ana@email.com']);
  });
});
