import { expect, test } from "@playwright/test";

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
});
