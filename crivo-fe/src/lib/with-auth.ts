import "server-only";

import { cookies } from "next/headers";
import { HTTPError } from "ky";

import { refresh } from "@/features/auth/http/refresh";
import {
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_COOKIE,
  REFRESH_TOKEN_MAX_AGE,
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  SESSION_EXPIRED_MESSAGE,
} from "./session";

const isUnauthorized = (error: unknown): boolean =>
  error instanceof HTTPError && error.response.status === 401;

/**
 * Escrever cookie durante o **render** de um Server Component é proibido
 * pelo Next (`Cookies can only be modified in a Server Action or Route
 * Handler`) — e a exceção que ele lança não é um erro comum: sobe até a
 * borda e vira "An unexpected response was received from the server",
 * quebrando a página inteira em vez de apenas não gravar o cookie.
 *
 * `withAuth` roda nos dois contextos: em Server Actions (onde gravar é
 * legítimo) e no render do `layout.tsx` do painel, que chama
 * `getTenantAction()` direto. Sem esta guarda, uma sessão que morre no
 * caminho derrubava a tela com erro técnico em vez de mandar para o login
 * — exatamente o sintoma relatado.
 *
 * Engolir aqui é seguro porque o cookie **não** é a fonte da verdade: o
 * crivo-be revalida o token a cada chamada, e o `middleware.ts` (que roda
 * antes do render, onde gravar é permitido) refaz a limpeza/renovação na
 * navegação seguinte.
 */
async function mutateCookiesIfAllowed(
  mutate: (store: Awaited<ReturnType<typeof cookies>>) => void,
): Promise<boolean> {
  try {
    mutate(await cookies());
    return true;
  } catch {
    return false;
  }
}

/**
 * Renova o par de tokens via `POST /auth/refresh` e regrava os cookies
 * httpOnly, devolvendo o novo access token para repetir a chamada original.
 * `null` quando não há refresh token ou o backend rejeita a rotação (refresh
 * também expirado/revogado) — aí não há como continuar, a sessão morreu.
 */
async function tryRefresh(): Promise<string | null> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return null;

  try {
    const tokens = await refresh(refreshToken);

    // Durante o render o Next recusa a gravação; o token novo ainda serve
    // para esta requisição, e o `middleware.ts` regrava o cookie na
    // navegação seguinte — ver `mutateCookiesIfAllowed`.
    await mutateCookiesIfAllowed((store) => {
      store.set(SESSION_COOKIE, tokens.accessToken, {
        ...SESSION_COOKIE_OPTIONS,
        httpOnly: true,
        maxAge: ACCESS_TOKEN_MAX_AGE,
      });
      store.set(REFRESH_COOKIE, tokens.refreshToken, {
        ...SESSION_COOKIE_OPTIONS,
        httpOnly: true,
        maxAge: REFRESH_TOKEN_MAX_AGE,
      });
    });

    return tokens.accessToken;
  } catch (error) {
    console.error("[Refresh Token Error]", error);
    return null;
  }
}

/**
 * Envolve uma chamada `http/*` autenticada com renovação automática de
 * sessão: se o crivo-be responder 401 (access token expirado no meio do
 * uso, não só quando o `exp` do JWT já está no passado), tenta
 * `POST /auth/refresh` uma vez, regrava os cookies e repete a chamada
 * original com o novo token. Só desloga se o refresh também falhar.
 *
 * `accessToken` inicial vem de quem chama (já resolvido via
 * `getServerSession`/`requireAdmin`, que também cuidam do RBAC local) —
 * este helper cuida exclusivamente do retry, não da autorização.
 */
export async function withAuth<T>(
  accessToken: string,
  fn: (accessToken: string) => Promise<T>,
): Promise<{ ok: true; data: T } | { ok: false; message: string }> {
  try {
    return { ok: true, data: await fn(accessToken) };
  } catch (error) {
    if (!isUnauthorized(error)) throw error;

    const newAccessToken = await tryRefresh();
    if (!newAccessToken) {
      await mutateCookiesIfAllowed((store) => {
        store.delete(SESSION_COOKIE);
        store.delete(REFRESH_COOKIE);
      });
      return { ok: false, message: SESSION_EXPIRED_MESSAGE };
    }

    return { ok: true, data: await fn(newAccessToken) };
  }
}
