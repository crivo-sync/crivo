import { expect, test } from "@playwright/test";

/**
 * A calculadora de plano da página `/planos`.
 *
 * Escolher entre quatro colunas de onze linhas — e ainda adivinhar se a
 * franquia de mensagens dá conta — é trabalho que sobra para o visitante.
 * Aqui ele informa dois números e o plano se aponta sozinho.
 *
 * A recomendação sai de `GET /plans`: se o preço mudar no Stripe, estes
 * testes acompanham. Por isso eles verificam o **critério** (cabe nas duas
 * dimensões) e não valores fixos, exceto onde o valor é o ponto.
 */

async function calcular(
  page: import("@playwright/test").Page,
  profissionais: number,
  atendimentos: number,
) {
  await page.locator("#profissionais").scrollIntoViewIfNeeded();
  await page.fill("#profissionais", String(profissionais));
  await page.fill("#atendimentos", String(atendimentos));

  return page.locator("section", { has: page.locator("#profissionais") });
}

test.describe("Planos — calculadora", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/planos");
    // A grade e a calculadora esperam o mesmo `GET /plans`.
    await expect(page.getByText("Solo").first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("clínica pequena cai no plano de entrada", async ({ page }) => {
    const calc = await calcular(page, 1, 100);

    await expect(calc).toContainText("Solo");
    await expect(calc).toContainText("R$ 49");
  });

  test("equipe maior que o teto sobe de plano, mesmo com poucas mensagens", async ({
    page,
  }) => {
    // 3 profissionais × 40 atendimentos = 300 mensagens, o que caberia
    // folgado no Essencial (1.000). Mas 3 não cabem no teto de 2 — e
    // recomendar por mensagem levaria a clínica a um plano onde ela não
    // consegue cadastrar a equipe.
    const calc = await calcular(page, 3, 40);

    await expect(calc).toContainText("Profissional");
    await expect(calc).not.toContainText("R$ 89");
  });

  test("volume alto sobe de plano, mesmo com equipe pequena", async ({
    page,
  }) => {
    // O espelho do teste anterior: 2 profissionais cabem no Essencial, mas
    // 2 × 400 × 2,5 = 2.000 mensagens estouram a franquia de 1.000.
    const calc = await calcular(page, 2, 400);

    await expect(calc).not.toContainText("R$ 89");
  });

  test("mostra a folga de mensagens, não só o plano", async ({ page }) => {
    const calc = await calcular(page, 1, 100);

    // Sem a folga, a clínica não tem como saber se escolheu apertado.
    await expect(calc).toContainText("de folga");
  });

  test("operação grande demais convida a conversar, não empurra o maior plano", async ({
    page,
  }) => {
    const calc = await calcular(page, 25, 200);

    // Vender um plano que sabidamente não comporta é vender cancelamento.
    await expect(calc).toContainText("maior que os planos");
    await expect(
      calc.getByRole("link", { name: /falar com a gente/i }),
    ).toBeVisible();
  });

  test("os quatro planos aparecem com os preços do backend", async ({
    page,
  }) => {
    const grade = page.getByRole("main");

    for (const [nome, preco] of [
      ["Solo", "R$ 49"],
      ["Essencial", "R$ 89"],
      ["Profissional", "R$ 179"],
      ["Clínica", "R$ 299"],
    ]) {
      await expect(grade.getByText(nome, { exact: true }).first()).toBeVisible();
      await expect(grade.getByText(preco).first()).toBeVisible();
    }
  });

  test("a franquia de mensagens aparece em cada plano", async ({ page }) => {
    // Cada mensagem tem custo real; esconder o teto criaria a surpresa que
    // o produto existe para evitar.
    //
    // `.first()`: o texto aparece duas vezes de propósito — no card e na
    // tabela comparativa mais abaixo.
    const grade = page.getByRole("main");

    await expect(
      grade.getByText("500 mensagens de WhatsApp por mês").first(),
    ).toBeVisible();
    await expect(
      grade.getByText("4.100 mensagens de WhatsApp por mês").first(),
    ).toBeVisible();
  });

  test("não anuncia o profissional adicional — o backend ainda não cobra", async ({
    page,
  }) => {
    // O preço existe no plano e no Stripe, mas cadastrar acima do teto é
    // recusado. Anunciar "depois R$ 35/mês cada" prometeria o que o sistema
    // nega na hora.
    const conteudo = await page.getByRole("main").innerText();

    expect(conteudo).not.toContain("/mês cada");
  });
});
