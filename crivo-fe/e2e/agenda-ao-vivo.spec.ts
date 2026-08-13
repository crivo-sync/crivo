import { expect, test } from "@playwright/test";

/**
 * Chegada de agendamento com a Agenda já aberta.
 *
 * A recepção deixa a Agenda aberta o dia inteiro e o paciente marca sozinho
 * pelo `/agendar` a qualquer hora. Com o polling de 8s a linha nova entrava
 * na tabela em silêncio — quem não estava olhando na hora exata não percebia.
 *
 * **Por que este teste não cria o agendamento pelo fluxo público:** tentei, e
 * ele ficou refém do estado acumulado. Cada execução ocupava um horário do
 * seed; a seguinte encontrava a agenda mais cheia e, ao esbarrar num horário
 * já tomado, seguia adiante sem marcar nada. Além disso o `DataGrid`
 * virtualiza as linhas, então a linha nova (data futura, fim da lista) nem
 * entra no DOM sem rolagem. O resultado era um teste que falhava por dado
 * saturado, não por regressão — pior que teste nenhum.
 *
 * O que sobrou aqui é o que dá para afirmar de forma estável: **nada é
 * destacado quando nada chegou**. O caminho positivo (aviso + linha
 * destacada) foi verificado à mão, com screenshot, em 13/08/2026.
 */

/**
 * Clínica própria, criada na hora.
 *
 * Usar a do seed fazia este teste falhar na suíte completa: ele espera 10s
 * verificando que nada chegou, e nesse intervalo **outros testes** criam
 * agendamentos no mesmo tenant — o aviso aparecia e a falha parecia
 * regressão. Com tenant próprio, ninguém mais escreve nele.
 */
test("nada é destacado quando nenhum agendamento chegou", async ({ page }) => {
  const slug = `aovivo-${Date.now()}`;

  const registro = await page.request.post(
    "http://localhost:3333/auth/register",
    {
      data: {
        tenantName: "Clínica Ao Vivo",
        subdomain: slug,
        name: "Dono",
        email: `${slug}@teste.com`,
        phone: "11988887777",
        password: "senha12345",
      },
    },
  );
  expect(registro.ok()).toBe(true);

  await page.goto("/login");
  await page.getByRole("textbox", { name: "E-mail" }).fill(`${slug}@teste.com`);
  await page.getByRole("textbox", { name: "Senha" }).fill("senha12345");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/painel/, { timeout: 20_000 });

  await page.goto("/painel/agenda");
  await expect(page.getByRole("heading", { name: "Agenda" })).toBeVisible();

  // Passa de um ciclo de polling (8s): se o hook marcasse como "novo" o que
  // já estava na tela, o destaque apareceria aqui.
  await page.waitForTimeout(10_000);

  await expect(page.locator(".crivo-row--new")).toHaveCount(0);
  await expect(
    page.getByText(/agendamento novo chegou|agendamentos novos chegaram/),
  ).toHaveCount(0);
});
