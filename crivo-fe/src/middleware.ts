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
 * Confirma com o crivo-be que o token é legítimo.
 *
 * O `exp` do payload não prova nada: qualquer um forja um JWT com data
 * futura, já que aqui só decodificamos (não conferimos a assinatura). O
 * segredo de assinatura fica **só** no backend de propósito — duplicá-lo
 * no frontend criaria dois lugares para rotacionar e vazar.
 *
 * `GET /users/me` é a rota mais barata que exige autenticação e responde
 * para qualquer papel.
 *
 * Só **401** derruba a sessão. Um 403 significa token legítimo com acesso
 * barrado por outro motivo (trial vencido, assinatura cancelada) — essa
 * pessoa precisa entrar no painel e ler o aviso do que aconteceu, não ser
 * jogada na tela de login sem explicação.
 */
async function isTokenAccepted(accessToken: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    return res.status !== 401;
  } catch {
    // Backend fora do ar: não dá para afirmar que o token é inválido.
    // Deixa passar — as chamadas da própria tela vão falhar e o
    // `QueryProvider` cuida do logout se for mesmo sessão morta.
    return true;
  }
}

/** Manda para o login preservando para onde a pessoa queria ir. */
function redirectToLogin(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";

  const response = NextResponse.redirect(url);
  // Cookie inservível não deve sobreviver ao redirect: senão a próxima
  // navegação repete a mesma ida e volta.
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  return response;
}

/**
 * Server Actions POSTam para a URL da página atual (ex.: `/painel/
 * configuracoes`) com o header `next-action`. Um redirect do middleware
 * nesse POST (302 → `/login`) chega ao client **sem**
 * `content-type: text/x-component` nem `x-action-redirect` — o router do
 * Next.js então lança *"An unexpected response was received from the
 * server."* no lugar do auto-logout do `QueryProvider` (o sintoma de
 * Configurações → Assinatura com sessão morta).
 *
 * O redirect é inútil aqui: a própria Server Action valida a sessão
 * (`getServerSession` + `withAuth`) e devolve `SESSION_EXPIRED_MESSAGE`,
 * que o client interpreta e desloga com navegação de página completa. O
 * bloqueio do middleware continua valendo para navegações HTML/RSC — que é
 * onde ele evita a casca do painel piscando antes das chamadas falharem.
 */
const isServerActionRequest = (request: NextRequest): boolean =>
  request.method === "POST" && Boolean(request.headers.get("next-action"));

/**
 * Porteiro do `/painel`: barra quem não tem sessão utilizável e renova o
 * access token ANTES da navegação chegar ao render.
 *
 * A renovação vive aqui porque `cookies().set()` só funciona em Server
 * Action/Route Handler — nunca durante o render de Server Component (onde
 * `layout.tsx` chamaria `getSession()`). Sem isso, todo access token
 * expirado forçava logout mesmo com um refresh token válido em mãos.
 *
 * O bloqueio também vive aqui, e não só no `layout.tsx`, porque é a única
 * camada que decide **antes** de renderizar qualquer coisa: com um cookie
 * inválido, a casca do painel chegava a aparecer vazia até as chamadas
 * voltarem 401 e o `QueryProvider` deslogar. Nenhum dado real vazava (o
 * crivo-be rejeita o token), mas a tela piscava logada.
 */
export async function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/painel")) {
    return NextResponse.next();
  }

  // Server Action: deixa a própria action tratar a sessão morta (ver
  // `isServerActionRequest`). Redirecionar aqui quebraria o router client.
  if (isServerActionRequest(request)) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(SESSION_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  // Sem access token não há o que renovar nem o que renderizar.
  if (!accessToken) return redirectToLogin(request);

  const exp = decodeJwtExp(accessToken);

  // Token que nem decodifica (forjado, truncado, sem `exp`) não serve para
  // nada — o backend vai rejeitá-lo de qualquer forma.
  if (!exp) return redirectToLogin(request);

  // Dentro da validade declarada — falta confirmar que a assinatura bate.
  if (exp * 1000 >= Date.now()) {
    return (await isTokenAccepted(accessToken))
      ? NextResponse.next()
      : redirectToLogin(request);
  }

  // Expirado e sem refresh token: não há como renovar.
  if (!refreshToken) return redirectToLogin(request);

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    // Refresh recusado (revogado/expirado): a sessão acabou de vez.
    if (!res.ok) return redirectToLogin(request);

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
    // Falha de rede (backend fora do ar). Deixar passar não ajudaria: o
    // token já está expirado, então toda chamada da tela voltaria 401 e a
    // pessoa veria um painel quebrado em vez da tela de login.
    return redirectToLogin(request);
  }
}

export const config = {
  matcher: ["/painel/:path*"],
};
