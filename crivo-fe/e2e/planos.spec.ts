import { expect, test } from "@playwright/test";

/**
 * A calculadora de plano da página `/planos`.
 *
 * Escolher entre quatro colunas de onze linhas — e ainda adivinhar se a
 * franquia de mensagens dá conta — é trabalho que sobra para o visitante.
 * Aqui ele informa dois números e o **primeiro plano cujo teto comporta**
 * (profissionais e mensagens) se aponta sozinho.
 *
 * Não conta com "profissional adicional": `CreateProfessionalUseCase`
 * recusa sempre o cadastro acima do teto (revertido em 17/08/2026, depois
 * de um bug breve que cobrava o adicional em vez de recusar e, na prática,
 * removia o limite do plano). Recomendar um plano menor + adicional
 * anunciaria uma capacidade que o cadastro não entrega.
 *
 * A recomendação sai de `GET /plans`: se o preço mudar no Stripe, estes
 * testes acompanham. Por isso eles verificam o **critério** (cabe e é o mais
 * barato) e não valores fixos, exceto onde o valor é o ponto.
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

  test("estourar o teto do plano menor pula para o próximo plano cheio", async ({
    page,
  }) => {
    // 3 profissionais passam do teto do Essencial (2 incluídos). Sem
    // adicional para cobrir a diferença, o próximo que comporta é o
    // Profissional (4 incluídos, R$ 179).
    const calc = await calcular(page, 3, 40);

    await expect(calc).toContainText("Profissional");
    await expect(calc).toContainText("R$ 179");
    await expect(calc).not.toContainText("adicional");
  });

  test("passar do teto por 1 já pula de plano, sem adicional para cobrir a diferença", async ({
    page,
  }) => {
    // 5 profissionais passam do teto do Profissional (4 incluídos) — sem
    // adicional para o 5º, precisa do Clínica (8 incluídos, R$ 299).
    const calc = await calcular(page, 5, 100);

    await expect(calc).toContainText("Clínica");
    await expect(calc).toContainText("R$ 299");
  });

  test("plano nunca mostra detalhamento de adicional — o preço é sempre o final", async ({
    page,
  }) => {
    // 2 profissionais cabem exatos no teto do Essencial: preço final, sem
    // nenhuma menção a "adicional" — o cadastro não vende isso mais.
    const calc = await calcular(page, 2, 120);

    await expect(calc).toContainText("Essencial");
    await expect(calc).toContainText("R$ 89");
    await expect(calc).not.toContainText("adicional");
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

  test("passar do teto de profissionais do maior plano convida a conversar", async ({
    page,
  }) => {
    // 9 profissionais passa do teto do Clínica (8), o maior plano — sem
    // adicional para cobrir a diferença, nenhum plano comporta.
    const calc = await calcular(page, 9, 120);

    await expect(calc).toContainText("maior que os planos");
  });

  test("avisa quando a franquia fica apertada", async ({ page }) => {
    // 8 profissionais × 200 atendimentos = 4.000 de 4.100 disponíveis.
    // Sem o aviso, a clínica descobre no dia 20 que as mensagens acabaram.
    const calc = await calcular(page, 8, 200);

    await expect(calc).toContainText("Fica apertado");
  });

  test("folga confortável não dispara o aviso", async ({ page }) => {
    const calc = await calcular(page, 1, 100);

    await expect(calc).not.toContainText("Fica apertado");
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

  test("nenhum card anuncia preço de profissional adicional", async ({
    page,
  }) => {
    // `CreateProfessionalUseCase` recusa sempre o cadastro acima do teto
    // (revertido em 17/08/2026 — ver comentário no topo do arquivo):
    // anunciar um preço de adicional aqui prometeria o que o cadastro nega
    // na hora. O único caminho para crescer além do teto é assinar um plano
    // maior.
    const tiers = ["solo", "basico", "intermediario", "avancado"];

    for (const tier of tiers) {
      await expect(page.getByTestId(`plan-card-${tier}`)).not.toContainText(
        "/mês cada",
      );
    }
  });
});
