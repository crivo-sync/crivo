import { BadRequestException } from '@nestjs/common';

import type { CsvRecord } from 'src/shared/csv/parse-csv';
import { PatientCsvService, type ResolvedColumns } from './patient-csv.service';

describe('PatientCsvService', () => {
  const service = new PatientCsvService();

  describe('resolveColumns', () => {
    it('encontra as colunas pelos nomes canônicos', () => {
      expect(
        service.resolveColumns(['nome', 'telefone', 'cpf', 'email']),
      ).toEqual({ name: 0, phone: 1, cpf: 2, email: 3 });
    });

    it('aceita sinônimos e ordem trocada', () => {
      expect(service.resolveColumns(['celular', 'paciente'])).toEqual({
        name: 1,
        phone: 0,
        cpf: null,
        email: null,
      });
    });

    it('trata cpf e email como opcionais', () => {
      expect(service.resolveColumns(['nome', 'telefone'])).toEqual({
        name: 0,
        phone: 1,
        cpf: null,
        email: null,
      });
    });

    it('recusa arquivo sem telefone, dizendo o que achou', () => {
      expect(() => service.resolveColumns(['nome', 'idade'])).toThrow(
        BadRequestException,
      );
      expect(() => service.resolveColumns(['nome', 'idade'])).toThrow(
        /a coluna telefone.*nome, idade/s,
      );
    });

    it('concorda o plural quando faltam as duas colunas', () => {
      expect(() => service.resolveColumns(['idade'])).toThrow(
        /as colunas nome e telefone/,
      );
    });
  });

  describe('extract', () => {
    const columns: ResolvedColumns = { name: 0, phone: 1, cpf: 2, email: 3 };

    const row = (cells: string[], line = 2): CsvRecord => ({ line, cells });

    it('extrai uma linha completa', () => {
      const result = service.extract(
        row(['Ana Souza', '11987650001', '11122233344', 'Ana@Email.com']),
        columns,
      );

      expect(result).toEqual({
        line: 2,
        name: 'Ana Souza',
        phone: '11987650001',
        cpf: '11122233344',
        email: 'ana@email.com',
      });
    });

    it('limpa a formatação de telefone e CPF da planilha', () => {
      const result = service.extract(
        row(['Ana', '(11) 98765-0001', '111.222.333-44', '']),
        columns,
      );

      expect(result).toMatchObject({
        phone: '11987650001',
        cpf: '11122233344',
        email: null,
      });
    });

    it('remove o código do país quando o número fica válido', () => {
      const result = service.extract(
        row(['Ana', '5511987650001', '', '']),
        columns,
      );

      expect(result).toMatchObject({ phone: '11987650001' });
    });

    it('NÃO corta o 55 de um número gaúcho de 11 dígitos', () => {
      // 55 é o DDD de Santa Maria/RS. Cortar aqui viraria um número inválido.
      const result = service.extract(
        row(['Ana', '55987650001', '', '']),
        columns,
      );

      expect(result).toMatchObject({ phone: '55987650001' });
    });

    it('aceita telefone fixo de 10 dígitos', () => {
      const result = service.extract(
        row(['Ana', '1133334444', '', '']),
        columns,
      );

      expect(result).toMatchObject({ phone: '1133334444' });
    });

    it('colapsa espaços repetidos do nome', () => {
      const result = service.extract(
        row(['  Ana   Maria  Souza ', '11987650001', '', '']),
        columns,
      );

      expect(result).toMatchObject({ name: 'Ana Maria Souza' });
    });

    it.each([
      [['', '11987650001', '', ''], /Nome está em branco/],
      [['A', '11987650001', '', ''], /Nome muito curto/],
      [['Ana', '', '', ''], /Telefone está em branco/],
      [['Ana', '123', '', ''], /Telefone inválido/],
      [['Ana', '11987650001', '123', ''], /CPF inválido/],
      [['Ana', '11987650001', '', 'nao-e-email'], /E-mail inválido/],
    ])('recusa %j', (cells, expected) => {
      const result = service.extract(row(cells), columns);

      expect(result).toMatchObject({ line: 2, message: expect.any(String) });
      expect((result as { message: string }).message).toMatch(expected);
    });

    it('devolve o nome junto do erro, para localizar a linha', () => {
      const result = service.extract(
        row(['Ana Souza', '123', '', '']),
        columns,
      );

      expect(result).toMatchObject({ name: 'Ana Souza' });
    });

    it('não quebra quando a linha tem menos colunas que o cabeçalho', () => {
      const result = service.extract(row(['Ana', '11987650001']), columns);

      expect(result).toMatchObject({ cpf: null, email: null });
    });
  });

  describe('dedupeKey', () => {
    it('usa o CPF quando existe', () => {
      expect(
        service.dedupeKey({ cpf: '11122233344', phone: '11987650001' }),
      ).toBe('cpf:11122233344');
    });

    it('cai para o telefone quando não há CPF', () => {
      expect(service.dedupeKey({ cpf: null, phone: '11987650001' })).toBe(
        'phone:11987650001',
      );
    });

    it('não confunde um CPF com um telefone de mesmo valor', () => {
      expect(
        service.dedupeKey({ cpf: '11987650001', phone: '11987650001' }),
      ).not.toBe(service.dedupeKey({ cpf: null, phone: '11987650001' }));
    });
  });
});
