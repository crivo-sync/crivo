/**
 * Mensagens de sessão/permissão compartilhadas entre Server Actions
 * (`src/lib/session.ts`, marcado `server-only`) e código client (hooks que
 * precisam detectar "a sessão expirou" para forçar logout automático).
 * Vive num arquivo à parte, sem `server-only`, só por isso.
 */

/** Mensagem estável para "a sessão morreu", independente do texto do backend. */
export const SESSION_EXPIRED_MESSAGE =
  "Sua sessão expirou. Faça login novamente.";

/** Mensagem única para ação bloqueada por papel insuficiente. */
export const FORBIDDEN_MESSAGE =
  "Você não tem permissão para executar esta ação.";
