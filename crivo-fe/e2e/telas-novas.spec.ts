import { expect, test } from "@playwright/test";

import { login } from "./support/auth";

/**
 * As telas que a recepção ainda não conhece: risco de falta, lista de espera
 * e caixa de entrada.
 *
 * O foco aqui é o que **explica a decisão** para quem opera — o score sem
 * motivo, ou a fila sem posição, viram números que ninguém consegue checar
 * nem contestar.
 */

test.describe("Risco de falta", () => {
  test("mostra o resumo por faixa e o motivo de cada paciente", async ({
    page,
  }) => {
    await login(page, "staff");
    await page.goto("/painel/agenda/risco");

    // Os chips de contagem: é por eles que a recepção dimensiona o dia.
    await expect(page.getByText(/\d+ alto/)).toBeVisible();
    await expect(page.getByText(/\d+ médio/)).toBeVisible();

    // O motivo é o ponto: "risco alto" sozinho não dá para checar.
    // `.first()` porque o mesmo motivo se repete em vários cards.
    await expect(
      page
        .getByText(/Ainda não confirmou presença|Já faltou|Primeira consulta/)
        .first(),
    ).toBeVisible();
  });

  test("trocar o período recarrega a lista", async ({ page }) => {
    await login(page, "staff");
    await page.goto("/painel/agenda/risco");

    await page.getByRole("combobox", { name: "Período" }).click();
    await page.getByRole("option", { name: "Próximos 30 dias" }).click();

    await expect(
      page.getByRole("combobox", { name: "Período" }),
    ).toContainText("30 dias");
  });
});

test.describe("Lista de espera", () => {
  test("coloca um paciente na fila e ele aparece", async ({ page }) => {
    await login(page, "staff");

    // Paciente próprio a cada execução: reusar alguém da base faria a
    // segunda rodada esbarrar na trava de duplicata e o teste falharia por
    // estado sujo, não por regressão.
    const nome = `E2E Espera ${Date.now()}`;
    await page.goto("/painel/pacientes");
    await page.getByRole("button", { name: /Novo paciente/i }).click();
    await page.getByLabel("Nome").fill(nome);
    await page.getByLabel(/Telefone/).fill("11991230000");
    await page.getByRole("button", { name: "Cadastrar" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await page.goto("/painel/agenda/espera");
    await page.getByRole("button", { name: /Adicionar à espera/i }).click();
    const dialog = page.getByRole("dialog");

    await dialog.getByLabel("Paciente").click();
    await page.getByRole("option", { name: nome }).click();

    await dialog.getByLabel("Procedimento").click();
    await page.getByRole("option").first().click();

    await dialog.getByRole("button", { name: "Adicionar" }).click();
    await expect(dialog).toHaveCount(0);

    // "Qualquer um" escrito, não célula vazia: vazio parece dado faltando,
    // quando é justamente o caso que aumenta a chance de encaixe.
    await expect(page.getByRole("gridcell", { name: nome })).toBeVisible();
    await expect(
      page.getByRole("gridcell", { name: "Qualquer um" }).first(),
    ).toBeVisible();
  });

  test("recusa o mesmo paciente duas vezes no mesmo procedimento", async ({
    page,
  }) => {
    // Duplicata é erro de digitação, não intenção — e duplicaria a oferta
    // quando a vaga abrisse.
    await login(page, "staff");
    await page.goto("/painel/agenda/espera");

    const jaNaFila = page.getByRole("row").nth(1);
    await expect(jaNaFila).toBeVisible();
    const nome = (await jaNaFila.getByRole("gridcell").nth(1).textContent())?.trim();

    await page.getByRole("button", { name: /Adicionar à espera/i }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Paciente").click();
    await page.getByRole("option", { name: nome! }).click();
    await dialog.getByLabel("Procedimento").click();
    await page.getByRole("option").first().click();
    await dialog.getByRole("button", { name: "Adicionar" }).click();

    await expect(
      page.getByText(/já está na lista de espera/i),
    ).toBeVisible();
  });
});

test.describe("Caixa de entrada", () => {
  test("a aba Recebidas abre", async ({ page }) => {
    await login(page, "staff");
    await page.goto("/painel/mensagens");

    await page.getByRole("tab", { name: "Recebidas" }).click();

    // Com a fila vazia, o aviso precisa dizer isso — tela em branco parece
    // erro de carregamento.
    await expect(
      page
        .getByText(/Nenhuma mensagem pendente|Recebida em/)
        .first(),
    ).toBeVisible();
  });
});
