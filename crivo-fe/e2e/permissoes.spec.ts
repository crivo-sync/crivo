import { expect, test } from "@playwright/test";

import { login } from "./support/auth";

/**
 * O que cada papel enxerga.
 *
 * Metade das regras do sistema é sobre o que a recepção **não** pode fazer,
 * e essas regras não aparecem em nenhum teste de "caminho feliz". Aqui elas
 * ficam explícitas — inclusive a proteção contra digitar a URL na mão, que
 * esconder o item de menu sozinho não resolve.
 */
test.describe("Permissões da recepção (STAFF)", () => {
  test("não vê Usuários no menu", async ({ page }) => {
    await login(page, "staff");

    await expect(
      page.getByRole("link", { name: "Usuários" }),
    ).toHaveCount(0);
  });

  test("digitar /painel/usuarios na URL não passa", async ({ page }) => {
    // Esconder o item do menu não é barreira: qualquer um cola a URL.
    await login(page, "staff");
    await page.goto("/painel/usuarios");

    await expect(page).not.toHaveURL(/\/painel\/usuarios/);
  });

  test("vê Configurações, mas não edita os textos das mensagens", async ({
    page,
  }) => {
    await login(page, "staff");
    await page.goto("/painel/configuracoes");

    // Leitura é liberada — a recepção precisa consultar telefone e endereço.
    await expect(
      page.getByRole("heading", { name: "Configurações" }),
    ).toBeVisible();

    await page.getByRole("tab", { name: "Mensagens automáticas" }).click();
    await expect(
      page.getByText(/Somente administradores podem editar os textos/i),
    ).toBeVisible();
  });

  test("não cadastra profissional", async ({ page }) => {
    await login(page, "staff");
    await page.goto("/painel/profissionais");

    await expect(
      page.getByRole("button", { name: /Novo profissional/i }),
    ).toHaveCount(0);
  });
});

test.describe("Permissões do administrador", () => {
  test("vê Usuários e edita os textos das mensagens", async ({ page }) => {
    await login(page, "admin");

    await expect(page.getByRole("link", { name: "Usuários" })).toBeVisible();

    await page.goto("/painel/configuracoes");
    await page.getByRole("tab", { name: "Mensagens automáticas" }).click();

    // O editor aparece de verdade, não o aviso de bloqueio.
    await expect(
      page.getByText(/Somente administradores podem editar/i),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: /Lembrete/i }).first(),
    ).toBeVisible();
  });
});
