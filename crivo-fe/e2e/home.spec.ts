import { expect, test } from "@playwright/test";

/**
 * A home vende dinheiro, não mecanismo.
 *
 * A calculadora é a única lógica de cálculo do site — e é a peça que
 * transforma "faltas dão prejuízo" em um número que o visitante reconhece
 * como o dele. Se a conta quebrar, a página inteira perde o argumento e
 * ninguém percebe: não há erro, só um total errado.
 */

test.describe("Home — quanto as faltas custam", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("a manchete fala da perda, não do produto", async ({ page }) => {
    // Quem lê é dono de clínica decidindo onde gastar. "Motor que evita
    // buracos na agenda" obrigava a traduzir sozinho para dinheiro.
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "faturamento do dia",
    );
  });

  test("a conta usa os números do visitante", async ({ page }) => {
    const calculadora = page.locator("#calculadora");
    await calculadora.scrollIntoViewIfNeeded();

    await page.fill("#no-shows-per-week", "5");
    await page.fill("#ticket-in-reais", "400");

    // 5 faltas × 4,33 semanas × R$ 400 = R$ 8.660,00/mês
    await expect(calculadora).toContainText("R$ 8.660,00");
    // …e o ano é o mesmo número × 12, não uma segunda conta.
    await expect(calculadora).toContainText("R$ 103.920,00");
  });

  test("mudar o ticket muda o total na hora", async ({ page }) => {
    const calculadora = page.locator("#calculadora");
    await calculadora.scrollIntoViewIfNeeded();

    await page.fill("#no-shows-per-week", "2");
    await page.fill("#ticket-in-reais", "100");
    await expect(calculadora).toContainText("R$ 866,00");

    await page.fill("#ticket-in-reais", "200");
    await expect(calculadora).toContainText("R$ 1.732,00");
  });

  test("campo zerado pede o dado em vez de mostrar R$ 0,00", async ({
    page,
  }) => {
    const calculadora = page.locator("#calculadora");
    await calculadora.scrollIntoViewIfNeeded();

    await page.fill("#no-shows-per-week", "0");

    // "R$ 0,00 por ano" pareceria defeito, não resposta.
    await expect(calculadora).toContainText("Preencha os dois campos");
    await expect(calculadora).not.toContainText("por ano");
  });

  test("o número vem com a ressalva de que nada zera as faltas", async ({
    page,
  }) => {
    const calculadora = page.locator("#calculadora");
    await calculadora.scrollIntoViewIfNeeded();

    // Sem esta linha o total insinua "o Crivo Sync recupera tudo isso" — promessa
    // que não medimos e que contradiz a régua do resto do produto.
    await expect(calculadora).toContainText("Nenhuma ferramenta zera as faltas");
  });

  test("a calculadora leva para o cadastro", async ({ page }) => {
    const calculadora = page.locator("#calculadora");
    await calculadora.scrollIntoViewIfNeeded();

    await calculadora
      .getByRole("link", { name: "Começar a reduzir isso" })
      .click();

    await expect(page).toHaveURL(/\/cadastro/);
  });

  test("a home também indica o plano pelo tamanho da clínica", async ({
    page,
  }) => {
    // Duas calculadoras com papéis distintos: `#calculadora` mostra a perda
    // (por que assinar), `#calculadora-plano` mostra qual plano (o quê
    // assinar). Quem chega pela home não deveria precisar ir até /planos
    // para descobrir a segunda resposta.
    const calc = page.locator("#calculadora-plano");
    await calc.scrollIntoViewIfNeeded();

    await page.fill("#profissionais", "3");
    await page.fill("#atendimentos", "140");

    await expect(calc).toContainText("Profissional");
    await expect(calc).toContainText("de folga");
  });

  test("a home não fala em jargão de engenharia", async ({ page }) => {
    // Termos que já estiveram na página e que dono de clínica não lê:
    // "multi-tenant white-label", "tríade integrada", "predição de no-show".
    const conteudo = await page.locator("body").innerText();

    expect(conteudo).not.toContain("multi-tenant");
    expect(conteudo).not.toContain("Tríade");
    expect(conteudo.toLowerCase()).not.toContain("no-show");
  });
});
