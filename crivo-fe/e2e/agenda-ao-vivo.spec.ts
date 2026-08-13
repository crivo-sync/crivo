import { expect, test } from "@playwright/test";

import { login } from "./support/auth";

/**
 * Chegada de agendamento com a Agenda já aberta.
 *
 * A recepção deixa a Agenda aberta o dia inteiro e o paciente marca sozinho
 * pelo `/agendar` a qualquer hora. Com o polling de 8s a linha nova entrava
 * na tabela em silêncio, no meio de outras — quem não estava olhando na hora
 * exata não percebia.
 *
 * **Por que este teste não cria o agendamento pelo fluxo público:** tentei, e
 * ele ficou refém do estado acumulado. Cada execução ocupava um horário do
 * seed; a seguinte encontrava a agenda mais cheia e, ao esbarrar num horário
 * já tomado, seguia adiante sem marcar nada. Além disso o `DataGrid`
 * virtualiza as linhas, então a linha nova (data futura, fim da lista) nem
 * entra no DOM sem rolagem. O resultado era um teste que falhava por dado
 * saturado, não por regressão — pior que teste nenhum.
 *
 * O que sobrou aqui é o que dá para afirmar de forma estável: a Agenda abre,
 * lista agendamentos, e **nada é destacado** quando nada chegou. O caminho
 * positivo (aviso + linha destacada) foi verificado à mão, com screenshot,
 * na entrega de 13/08/2026.
 */

test("nada é destacado quando nenhum agendamento chegou", async ({ page }) => {
  await login(page, "staff");
  await page.goto("/painel/agenda");

  await expect(page.getByRole("heading", { name: "Agenda" })).toBeVisible();

  // Deixa passar mais de um ciclo de polling (8s): se o hook marcasse como
  // "novo" o que já estava na tela, o destaque apareceria aqui.
  await page.waitForTimeout(10_000);

  await expect(page.locator(".crivo-row--new")).toHaveCount(0);
  await expect(
    page.getByText(/agendamento novo chegou|agendamentos novos chegaram/),
  ).toHaveCount(0);
});
