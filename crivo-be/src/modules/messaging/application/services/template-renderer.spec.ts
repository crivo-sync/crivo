import {
  missingRequiredPlaceholders,
  renderTemplate,
  unknownPlaceholders,
  usedPlaceholders,
  type TemplateValues,
} from './template-renderer';

const VALUES: TemplateValues = {
  paciente: 'Ana',
  clinica: 'Clínica Sorriso',
  profissional: 'Dra. Helena',
  procedimento: 'Limpeza',
  data: '12/08',
  hora: '14:30',
  link: 'https://crivo.app/c/abc',
};

describe('renderTemplate', () => {
  it('troca os marcadores pelos valores', () => {
    expect(
      renderTemplate('Olá {{paciente}}, dia {{data}} às {{hora}}.', VALUES),
    ).toBe('Olá Ana, dia 12/08 às 14:30.');
  });

  it('tolera espaço dentro das chaves', () => {
    expect(renderTemplate('{{ paciente }} e {{paciente}}', VALUES)).toBe(
      'Ana e Ana',
    );
  });

  it('não diferencia maiúsculas', () => {
    expect(renderTemplate('{{PACIENTE}} {{Data}}', VALUES)).toBe('Ana 12/08');
  });

  it('repete o mesmo marcador quantas vezes aparecer', () => {
    expect(renderTemplate('{{paciente}}, {{paciente}}!', VALUES)).toBe(
      'Ana, Ana!',
    );
  });

  it('preserva quebras de linha e emoji do texto', () => {
    expect(renderTemplate('Olá {{paciente}}! 👋\n\n📅 {{data}}', VALUES)).toBe(
      'Olá Ana! 👋\n\n📅 12/08',
    );
  });

  it('remove marcador desconhecido em vez de deixar cru', () => {
    // Deixar `{{telefone}}` no texto faria o paciente receber uma mensagem
    // visivelmente quebrada.
    expect(renderTemplate('Oi {{telefone}}fim', VALUES)).toBe('Oi fim');
  });

  it('deixa intacto texto sem marcador', () => {
    expect(renderTemplate('Mensagem fixa.', VALUES)).toBe('Mensagem fixa.');
  });

  it('ignora chave simples (não é marcador)', () => {
    expect(renderTemplate('{paciente} e {{paciente}}', VALUES)).toBe(
      '{paciente} e Ana',
    );
  });
});

describe('usedPlaceholders', () => {
  it('lista sem repetir', () => {
    expect(usedPlaceholders('{{data}} {{hora}} {{data}}')).toEqual([
      'data',
      'hora',
    ]);
  });

  it('devolve vazio quando não há marcador', () => {
    expect(usedPlaceholders('texto puro')).toEqual([]);
  });
});

describe('unknownPlaceholders', () => {
  it('acusa marcador que não existe', () => {
    expect(unknownPlaceholders('{{paciente}} {{telefone}}')).toEqual([
      'telefone',
    ]);
  });

  it('aceita todos os marcadores válidos', () => {
    expect(
      unknownPlaceholders(
        '{{paciente}}{{clinica}}{{profissional}}{{procedimento}}{{data}}{{hora}}{{link}}',
      ),
    ).toEqual([]);
  });
});

describe('missingRequiredPlaceholders', () => {
  it('exige data, hora e link', () => {
    // Lembrete sem data/hora não lembra nada; sem link o paciente não
    // consegue confirmar, que é o objetivo da mensagem.
    expect(missingRequiredPlaceholders('Olá {{paciente}}')).toEqual([
      'data',
      'hora',
      'link',
    ]);
  });

  it('não reclama quando estão todos presentes', () => {
    expect(missingRequiredPlaceholders('{{data}} {{hora}} {{link}}')).toEqual(
      [],
    );
  });

  it('aponta só o que falta', () => {
    expect(missingRequiredPlaceholders('{{data}} {{hora}}')).toEqual(['link']);
  });
});
