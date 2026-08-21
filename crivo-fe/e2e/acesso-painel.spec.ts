import { expect, test } from "@playwright/test";

import { login } from "./support/auth";

/**
 * O painel não pode aparecer para quem não tem sessão legítima.
 *
 * O caso do token forjado é o que motivou estes testes: um JWT com
 * assinatura falsa e `exp` no futuro passava pelo middleware (que só
 * decodifica o payload, sem verificar assinatura) e a casca do painel
 * chegava a renderizar vazia até as chamadas voltarem 401. Nenhum dado
 * real vazava — o crivo-be rejeita o token —, mas a tela piscava logada.
 * Agora o middleware confirma o token com o backend antes de deixar
 * passar.
 */

/** Assinatura inválida, `exp` bem no futuro. Decodifica, mas não é legítimo. */
const TOKEN_FORJADO =
  "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJmYWtlIiwidGVuYW50SWQiOiJmYWtlIiwicm9sZSI6IkFETUlOIiwiZXhwIjo5OTk5OTk5OTk5fQ.assinatura-invalida";

test.describe("Acesso ao painel", () => {
  test("sem sessão, vai para o login", async ({ page }) => {
    await page.goto("/painel");

    await expect(page).toHaveURL(/\/login/);
  });

  test("token forjado não abre o painel", async ({ page, context }) => {
    await context.addCookies([
      {
        name: "crivo_session",
        value: TOKEN_FORJADO,
        url: "http://localhost:3000",
      },
    ]);

    await page.goto("/painel");

    await expect(page).toHaveURL(/\/login/);
  });

  test("sub-rota também não escapa", async ({ page, context }) => {
    await context.addCookies([
      {
        name: "crivo_session",
        value: TOKEN_FORJADO,
        url: "http://localhost:3000",
      },
    ]);

    // Usuários é a tela mais sensível (só ADMIN); se alguma rota fosse
    // deixar passar, seria a que menos podemos permitir.
    await page.goto("/painel/usuarios");

    await expect(page).toHaveURL(/\/login/);
  });

  test("cookie que nem é JWT vai para o login", async ({ page, context }) => {
    await context.addCookies([
      { name: "crivo_session", value: "abc123", url: "http://localhost:3000" },
    ]);

    await page.goto("/painel");

    await expect(page).toHaveURL(/\/login/);
  });

  /**
   * Sessão morta **com refresh token junto**, que é o par de cookies que uma
   * sessão real deixa para trás ao expirar.
   *
   * ⚠️ Com o backend no ar, quem barra isto é o `middleware.ts` (confirma o
   * token em `/users/me` antes do render) — este teste **não** exercita o
   * `withAuth`, e por isso não teria pego sozinho o bug de 18/08/2026
   * (`cookies().delete()` durante o render do `layout.tsx`, que só acontece
   * quando o middleware deixa passar por o backend não responder).
   * Reproduzir aquele caminho exigiria derrubar o backend no meio da suíte,
   * o que deixaria o teste frágil e lento; a verificação daquele cenário foi
   * feita à mão, com o backend parado. O que este teste garante é o
   * contrato visível: o par de cookies morto termina no login, sem erro de
   * runtime na tela.
   */
  test("sessão morta com refresh inválido vai para o login, sem quebrar a tela", async ({
    page,
    context,
  }) => {
    const erros: string[] = [];
    page.on("pageerror", (error) => erros.push(error.message));

    await context.addCookies([
      {
        name: "crivo_session",
        value: TOKEN_FORJADO,
        url: "http://localhost:3000",
      },
      {
        name: "crivo_refresh",
        value: "refresh-invalido",
        url: "http://localhost:3000",
      },
    ]);

    await page.goto("/painel/configuracoes");

    await expect(page).toHaveURL(/\/login/);
    expect(erros).toEqual([]);
  });

  /**
   * Sessão morre **com o painel aberto** e uma Server Action é chamada em
   * seguida — é o caminho que travava com *"An unexpected response was
   * received from the server."* (o sintoma de Configurações → Assinatura).
   *
   * O middleware barra a sessão morta em navegações HTML/RSC (testes
   * acima), mas uma Server Action POSTa para a URL da página atual com o
   * header `next-action`; responder 302 nesse POST quebra o router do
   * Next.js, que não interpreta o redirect e joga o erro genérico em
   * inglês — o auto-logout do `QueryProvider` nunca disparava. Agora o
   * `middleware.ts` deixa a própria action tratar a sessão morta
   * (`SESSION_EXPIRED_MESSAGE` → logout). Este teste garante o contrato
   * visível: sessão morta no meio do uso termina no login, sem erro
   * técnico na tela.
   */
  test("sessão morta no meio do uso desloga via Server Action, sem erro técnico", async ({
    page,
    context,
  }) => {
    const erros: string[] = [];
    page.on("pageerror", (error) => erros.push(error.message));

    await login(page, "admin");
    await page.goto("/painel/configuracoes");

    // Aba "Dados da clínica" (padrão) monta o TenantSettings e popula o
    // cache do `useTenant`; espera o formulário aparecer para o fetch
    // terminar antes de matar a sessão.
    await expect(page.getByText("Salvar alterações")).toBeVisible();

    // Simula a sessão morrer com o painel aberto: apaga os cookies enquanto
    // a página está montada. As queries já carregadas ficam em cache; a
    // próxima Server Action sai sem cookie de sessão.
    await context.clearCookies();

    // A aba Assinatura monta o `SubscriptionSettings`, que busca o uso de
    // mensagens via Server Action (`getMessageUsageAction`) — o caminho que
    // antes travava com o erro genérico em vez de deslogar.
    await page.getByRole("tab", { name: "Assinatura", exact: true }).click();

    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });
    expect(erros).toEqual([]);
    await expect(page.locator("body")).not.toContainText(
      "An unexpected response was received from the server.",
    );
  });

  /**
   * A URL interna da API nunca deve aparecer para quem usa o sistema.
   *
   * O vazamento real aconteceu com o backend fora do ar: a mensagem crua do
   * ky (*"Request failed due to a network error: GET
   * http://localhost:3333/tenants/me"*) ia inteira para a tela da clínica.
   * `beforeError` em `config/api.ts` passou a trocá-la por texto em
   * português — verificado à mão com o backend parado, já que derrubá-lo
   * aqui tornaria a suíte frágil.
   *
   * Este teste é a rede de segurança barata: garante que o caminho de
   * sessão inválida (o mais comum) não passa a exibir endereço de
   * infraestrutura se alguém mexer no tratamento de erro.
   */
  test("erro de servidor não expõe o endereço da API", async ({
    page,
    context,
  }) => {
    await context.addCookies([
      {
        name: "crivo_session",
        value: TOKEN_FORJADO,
        url: "http://localhost:3000",
      },
    ]);

    await page.goto("/painel");
    await expect(page).toHaveURL(/\/login/);

    await expect(page.locator("body")).not.toContainText("localhost:3333");
  });
});
