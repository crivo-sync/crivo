import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "crivo_session";
const REFRESH_COOKIE = "crivo_refresh";

const ACCESS_TOKEN_MAX_AGE = 15 * 60;
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

const COOKIE_OPTIONS = {
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  httpOnly: true,
};

function decodeJwtExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

/**
 * Renova o access token ANTES da navegação chegar ao render, quando o
 * cookie de sessão já expirou. `cookies().set()` só funciona em Server
 * Action/Route Handler — nunca durante o render de Server Component (onde
 * `layout.tsx` chamaria `getSession()`) — então esta é a única camada capaz
 * de trocar o cookie antes de `getSession()` rodar e decidir redirecionar.
 * Sem isso, todo access token expirado forçava logout mesmo com um refresh
 * token válido em mãos.
 */
export async function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/painel")) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(SESSION_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!accessToken || !refreshToken) return NextResponse.next();

  const exp = decodeJwtExp(accessToken);
  if (!exp || exp * 1000 >= Date.now()) return NextResponse.next();

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return NextResponse.next();

    const tokens = (await res.json()) as {
      accessToken: string;
      refreshToken: string;
    };

    const response = NextResponse.next();
    response.cookies.set(SESSION_COOKIE, tokens.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });
    response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });
    return response;
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/painel/:path*"],
};
