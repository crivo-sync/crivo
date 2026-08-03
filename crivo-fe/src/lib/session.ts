import "server-only";

import { cookies } from "next/headers";

export const SESSION_COOKIE = "crivo_session";
export const REFRESH_COOKIE = "crivo_refresh";
/** Não-httpOnly de propósito: só nome/e-mail para exibição na UI, nunca autenticação. */
export const DISPLAY_NAME_COOKIE = "crivo_display_name";

/** Mensagem estável para "a sessão morreu", independente do texto do backend. */
export const SESSION_EXPIRED_MESSAGE =
  "Sua sessão expirou. Faça login novamente.";

export type SessionRole = "ADMIN" | "STAFF";

type JwtPayload = {
  sub: string;
  tenantId: string;
  role: SessionRole;
  exp?: number;
};

/**
 * Decodifica o payload do JWT sem verificar assinatura — só leitura, para
 * decisões de UI (ex: quais itens do menu mostrar). O backend é sempre a
 * autoridade real: toda chamada leva o token e é o crivo-be quem valida
 * ou rejeita de verdade.
 */
function decodeJwtPayload(token: string): JwtPayload | null {
  const segments = token.split(".");
  if (segments.length !== 3) return null;

  try {
    const payload = Buffer.from(segments[1], "base64url").toString("utf-8");
    return JSON.parse(payload) as JwtPayload;
  } catch {
    return null;
  }
}

export type Session = {
  userId: string;
  tenantId: string;
  role: SessionRole;
  displayName: string | null;
};

export const getSession = async (): Promise<Session | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  if (payload.exp && payload.exp * 1000 < Date.now()) return null;

  return {
    userId: payload.sub,
    tenantId: payload.tenantId,
    role: payload.role,
    displayName: cookieStore.get(DISPLAY_NAME_COOKIE)?.value ?? null,
  };
};

export type ServerSession = {
  /** Access token (JWT) do crivo-be, repassado como Bearer nas chamadas. */
  accessToken: string;
};

/**
 * Lê o access token do cookie httpOnly, sem round-trip de rede: a validade
 * real é sempre decidida pelo crivo-be a cada chamada. Retorna `null` quando
 * não há sessão — quem chama trata como "deslogado".
 *
 * Server Actions leem daqui e repassam o token para a camada `http/`, que
 * permanece pura (sem `next/headers`) e testável isoladamente.
 */
export const getServerSession = async (): Promise<ServerSession | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return { accessToken: token };
};

/** Mensagem única para ação bloqueada por papel insuficiente. */
export const FORBIDDEN_MESSAGE =
  "Você não tem permissão para executar esta ação.";

export type AdminSession = ServerSession & { role: SessionRole };

/**
 * Resolve token + papel de uma vez para Server Actions de escrita restritas
 * a ADMIN, devolvendo qual erro ocorreu para a action traduzir na resposta.
 *
 * O crivo-be continua sendo a autoridade final (`@Roles(Role.ADMIN)`) — esta
 * checagem existe para falhar cedo, com mensagem em português, em vez de
 * gastar uma chamada HTTP que voltaria 403 com texto genérico.
 */
export const requireAdmin = async (): Promise<
  | { ok: true; session: AdminSession }
  | { ok: false; reason: "unauthenticated" | "forbidden" }
> => {
  const session = await getSession();
  if (!session) return { ok: false, reason: "unauthenticated" };
  if (session.role !== "ADMIN") return { ok: false, reason: "forbidden" };

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return { ok: false, reason: "unauthenticated" };

  return { ok: true, session: { accessToken: token, role: session.role } };
};
