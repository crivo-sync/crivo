import { detectReplyIntent } from './reply-intent';

describe('detectReplyIntent', () => {
  describe('confirma', () => {
    it.each([
      'sim',
      'SIM',
      'Sim',
      'sim!',
      'Sim! 👍',
      '  sim  ',
      's',
      '1',
      'ok',
      'OK',
      'confirmo',
      'Confirmado',
      'confirmo presença',
      'estarei lá',
      'positivo',
    ])('%s → CONFIRM', (text) => {
      expect(detectReplyIntent(text)).toBe('CONFIRM');
    });
  });

  describe('cancela', () => {
    it.each([
      'não',
      'NAO',
      'nao',
      'n',
      '2',
      'cancelar',
      'Desmarcar',
      'não posso',
      'não vou',
      'preciso remarcar',
    ])('%s → CANCEL', (text) => {
      expect(detectReplyIntent(text)).toBe('CANCEL');
    });
  });

  describe('não arrisca quando é ambíguo', () => {
    it.each([
      // O caso que motiva casar frase inteira em vez de `includes`: contém
      // "sim", mas é uma recusa.
      'não posso, sim?',
      'vou tentar chegar',
      'acho que sim',
      'posso remarcar?',
      'quem fala?',
      'obrigado',
      'bom dia',
      '',
      '   ',
      '👍',
      'simplesmente esqueci',
    ])('%s → UNKNOWN', (text) => {
      expect(detectReplyIntent(text)).toBe('UNKNOWN');
    });
  });

  it('ignora acento, caixa e pontuação', () => {
    // As três formas chegam de teclados diferentes e significam o mesmo.
    expect(detectReplyIntent('não')).toBe('CANCEL');
    expect(detectReplyIntent('NÃO')).toBe('CANCEL');
    expect(detectReplyIntent('Nao.')).toBe('CANCEL');
  });

  it('trata emoji como pontuação, não como texto', () => {
    expect(detectReplyIntent('sim 👍')).toBe('CONFIRM');
    expect(detectReplyIntent('👍 confirmo')).toBe('CONFIRM');
  });
});
