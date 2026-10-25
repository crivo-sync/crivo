import { Prisma } from '@prisma/client';

/**
 * As duas constraints de banco que barram a reserva dupla sob corrida
 * (`appointments_blocking_slot_unique` e `appointments_no_overlap_per_professional`,
 * ver comentário em `schema.prisma`) chegam ao driver com códigos diferentes:
 * o índice único vira `P2002` (violação de unicidade, path padrão do
 * Prisma), mas o `EXCLUDE` do Postgres não é unicidade — chega como
 * `P2039` com a SQLSTATE original `23P01` dentro de
 * `error.meta.driverAdapterError.cause.code` (driver adapter do Prisma 7).
 * Sem checar as duas, metade dos conflitos de horário vira 500 em vez do
 * 409 amigável.
 */
export function isSlotConflictError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  if (error.code === 'P2002') {
    return true;
  }

  const cause = (
    error.meta?.driverAdapterError as { cause?: { code?: string } } | undefined
  )?.cause;

  return cause?.code === '23P01';
}
