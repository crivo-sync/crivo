import { Prisma } from '@prisma/client';

import { isSlotConflictError } from './is-slot-conflict-error';

function knownRequestError(
  code: string,
  meta?: Record<string, unknown>,
): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('mock', {
    code,
    clientVersion: '7.9.1',
    meta,
  });
}

describe('isSlotConflictError', () => {
  it('detecta violação do índice único parcial (P2002)', () => {
    expect(isSlotConflictError(knownRequestError('P2002'))).toBe(true);
  });

  it('detecta violação da exclusion constraint (P2039 + SQLSTATE 23P01)', () => {
    const error = knownRequestError('P2039', {
      driverAdapterError: { cause: { code: '23P01' } },
    });

    expect(isSlotConflictError(error)).toBe(true);
  });

  it('ignora P2039 de outra causa (SQLSTATE diferente)', () => {
    const error = knownRequestError('P2039', {
      driverAdapterError: { cause: { code: '23505' } },
    });

    expect(isSlotConflictError(error)).toBe(false);
  });

  it('ignora outros PrismaClientKnownRequestError', () => {
    expect(isSlotConflictError(knownRequestError('P2025'))).toBe(false);
  });

  it('ignora erros que não são do Prisma', () => {
    expect(isSlotConflictError(new Error('boom'))).toBe(false);
    expect(isSlotConflictError(null)).toBe(false);
    expect(isSlotConflictError(undefined)).toBe(false);
  });
});
