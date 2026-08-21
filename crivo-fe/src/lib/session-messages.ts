/**
 * Mensagens de sessão/permissão compartilhadas entre Server Actions
 * (`src/lib/session.ts`, marcado `server-only`) e código client (hooks que
 * precisam detectar "a sessão expirou" para forçar logout automático).
 * Vive num arquivo à parte, sem `server-only`, só por isso.
 */

/** Mensagem estável para "a sessão morreu", independente do texto do backend. */
export const SESSION_EXPIRED_MESSAGE =
  "Sua sessão expirou. Faça login novamente.";

/**
 * Mensagem do router client do Next.js quando uma Server Action responde algo
 * que ele não sabe interpretar — neste app, a causa é o redirect do middleware
 * em sessão morta (302 sem `x-action-redirect`/Flight). Detectada no
 * `QueryProvider` como gatilho adicional de auto-logout, além da
 * `SESSION_EXPIRED_MESSAGE`.
 */
export const UNEXPECTED_SERVER_RESPONSE_MESSAGE =
  "An unexpected response was received from the server.";

/** Mensagem única para ação bloqueada por papel insuficiente. */
export const FORBIDDEN_MESSAGE =
  "Você não tem permissão para executar esta ação.";
