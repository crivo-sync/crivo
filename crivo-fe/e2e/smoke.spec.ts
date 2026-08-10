import { expect, test } from "@playwright/test";

import { login } from "./support/auth";

/**
 * O mínimo que precisa funcionar para o resto da suíte fazer sentido.
 * Se este arquivo falha, os outros vão falhar por ambiente, não por bug.
 */
test.describe("Fundamentos", () => {
  test("recepção entra e chega no painel", async ({ page }) => {
    await login(page, "staff");

    await expect(page.getByRole("heading", { name: "Painel" })).toBeVisible();
  });

  test("credencial errada não entra", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("recepcao@clinicasorriso.com.br");
    await page.getByLabel("Senha").fill("senha-errada");
    await page.getByRole("button", { name: "Entrar" }).click();

    // Continua no login e mostra o erro — sem isso, uma senha errada que
    // "passa" só apareceria em produção.
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("alert")).toBeVisible();
  });

  test("as quatro abas da Agenda abrem", async ({ page }) => {
    await login(page, "staff");

    // Navega por URL, não por clique: as abas são rotas de verdade, e clicar
    // em sequência dispara o clique seguinte antes de a navegação terminar —
    // o teste falharia por corrida, não por regressão.
    for (const [url, titulo] of [
      ["/painel/agenda", "Agenda"],
      ["/painel/agenda/calendario", "Agenda"],
      ["/painel/agenda/risco", "Risco de falta"],
      ["/painel/agenda/espera", "Lista de espera"],
    ] as const) {
      await page.goto(url);
      await expect(
        page.getByRole("heading", { name: titulo, exact: true }),
      ).toBeVisible();
    }
  });

  test("clicar na aba navega de verdade", async ({ page }) => {
    // Complementa o teste acima: aquele prova que as rotas existem, este
    // prova que os links das abas apontam para elas.
    await login(page, "staff");
    await page.goto("/painel/agenda");

    const aba = page.getByRole("tab", { name: "Lista de espera" });

    // Espera a aba estar clicável antes de clicar. Sem isso o teste ficava
    // instável: passava sozinho e falhava na suíte completa, porque o clique
    // caía antes de o React hidratar e o link não respondia.
    await expect(aba).toBeVisible();
    await aba.click();

    await expect(page).toHaveURL(/\/painel\/agenda\/espera/, {
      timeout: 20_000,
    });
  });
});
