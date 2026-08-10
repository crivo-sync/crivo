import { expect, test, type Locator, type Page } from "@playwright/test";

import { login } from "./support/auth";

/**
 * A jornada que a recepção faz dezenas de vezes por dia.
 *
 * Cobre a **cascata** do formulário — cada campo só libera depois do
 * anterior. Essa regra existe porque sem ela o calendário oferecia dias que
 * o backend recusaria, e a tela parecia quebrada quando na verdade a regra
 * estava certa.
 */

/** Nome único por execução: sem isto, rodar duas vezes acumula lixo no banco. */
const pacienteTeste = () => `E2E Paciente ${Date.now()}`;

/**
 * Abre o formulário e devolve um escopo restrito ao dialog.
 *
 * O escopo não é preciosismo: a tela de trás tem os mesmos rótulos nos
 * filtros ("Paciente", "Profissional"), e um seletor de página inteira casa
 * com os dois — o teste falharia por ambiguidade, não por bug.
 */
async function abrirNovoAgendamento(page: Page) {
  await page.goto("/painel/agenda");
  await page.getByRole("button", { name: /Novo agendamento/i }).click();

  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name: "Novo agendamento" }),
  ).toBeVisible();

  return dialog;
}

test.describe("Novo agendamento", () => {
  test("os campos abrem em cascata, não todos de uma vez", async ({ page }) => {
    await login(page, "staff");
    const dialog = await abrirNovoAgendamento(page);

    // Sem paciente, o resto está travado: preencher fora de ordem fazia a
    // lista de procedimentos mudar embaixo do que já tinha sido escolhido.
    await expect(dialog.getByLabel("Profissional")).toBeDisabled();
    await expect(dialog.getByLabel("Procedimento")).toBeDisabled();
    await expect(campoDia(dialog)).toBeDisabled();

    await dialog.getByLabel("Paciente").click();
    await page.getByRole("option").first().click();
    await expect(dialog.getByLabel("Profissional")).toBeEnabled();
    // Procedimento continua travado — depende do profissional.
    await expect(dialog.getByLabel("Procedimento")).toBeDisabled();

    await dialog.getByLabel("Profissional").click();
    await page.getByRole("option").first().click();
    await expect(dialog.getByLabel("Procedimento")).toBeEnabled();
    await expect(campoDia(dialog)).toBeDisabled();

    await dialog.getByLabel("Procedimento").click();
    await page.getByRole("option").first().click();
    // Só agora o dia libera: antes disso não dá para saber quais dias
    // desabilitar (a grade é de quem atende, a duração define se cabe).
    await expect(campoDia(dialog)).toBeEnabled();
  });

  test("os horários mostram início e fim, não só o começo", async ({
    page,
  }) => {
    // Uma lista de "10:00, 10:15, 10:30" passava a impressão de consultas de
    // 15 min. Mostrar "10:00 → 10:30" elimina a leitura errada.
    await login(page, "staff");
    const dialog = await abrirNovoAgendamento(page);

    await dialog.getByLabel("Paciente").click();
    await page.getByRole("option").first().click();
    await dialog.getByLabel("Profissional").click();
    await page.getByRole("option").first().click();
    await dialog.getByLabel("Procedimento").click();
    await page.getByRole("option").first().click();

    // Escolhe um dia útil futuro pelo campo de data.
    const dia = proximoDiaUtil(7);
    await preencherDia(dialog, dia);

    const chip = dialog.getByRole("button", { name: /\d{2}:\d{2} → \d{2}:\d{2}/ });
    await expect(chip.first()).toBeVisible();
  });

  test("cria o agendamento e ele aparece na lista", async ({ page }) => {
    await login(page, "staff");

    // Paciente próprio, para o teste não depender de quem já existe na base
    // nem esbarrar em conflito de horário com o seed.
    const nome = pacienteTeste();
    await page.goto("/painel/pacientes");
    await page.getByRole("button", { name: /Novo paciente/i }).click();
    await page.getByLabel("Nome").fill(nome);
    await page.getByLabel(/Telefone/).fill("11991234567");
    await page.getByRole("button", { name: "Cadastrar" }).click();
    await expect(page.getByText(nome)).toBeVisible();

    const dialog = await abrirNovoAgendamento(page);
    await dialog.getByLabel("Paciente").click();
    await page.getByRole("option", { name: nome }).click();
    await dialog.getByLabel("Profissional").click();
    await page.getByRole("option").first().click();
    await dialog.getByLabel("Procedimento").click();
    await page.getByRole("option").first().click();
    await preencherDia(dialog, proximoDiaUtil(9));

    await dialog
      .getByRole("button", { name: /\d{2}:\d{2} → \d{2}:\d{2}/ })
      .first()
      .click();
    await dialog.getByRole("button", { name: "Agendar" }).click();

    // O dialog fecha — sinal de que o backend aceitou.
    await expect(
      page.getByRole("heading", { name: "Novo agendamento" }),
    ).toHaveCount(0);

    // Filtra pelo paciente para achar o agendamento: a lista abre ordenada
    // por data e o registro novo (futuro) cai numa página posterior.
    await page.getByRole("combobox", { name: "Paciente" }).click();
    await page.getByRole("option", { name: nome }).click();

    await expect(page.getByRole("gridcell", { name: nome })).toBeVisible();
  });
});

/**
 * O campo "Dia" do MUI DatePicker expõe **três** elementos com o mesmo
 * rótulo (o grupo, os spinbuttons dos segmentos e um input escondido), e
 * `getByLabel` casa com os três.
 *
 * Uso o `spinbutton` porque é ele que carrega `aria-disabled` — no `group`
 * o MUI só põe a classe `Mui-disabled`, que o Playwright (corretamente) não
 * lê como estado desabilitado.
 */
const campoDia = (dialog: Locator) =>
  dialog.getByRole("spinbutton", { name: "Dia" });

/**
 * Digita a data no campo segmentado do MUI.
 *
 * `fill()` não serve: o campo é composto por spinbuttons (DD/MM/AAAA), não
 * um `<input>` de texto. Clicar e digitar é o que a recepção faz de fato.
 */
async function preencherDia(dialog: Locator, data: string) {
  await campoDia(dialog).click();
  await dialog.page().keyboard.type(data.replace(/\D/g, ""));
}

/** `DD/MM/AAAA` de um dia útil a partir de hoje + `offset`. */
function proximoDiaUtil(offset: number): string {
  const data = new Date();
  data.setDate(data.getDate() + offset);
  while (data.getDay() === 0 || data.getDay() === 6) {
    data.setDate(data.getDate() + 1);
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(data.getDate())}/${pad(data.getMonth() + 1)}/${data.getFullYear()}`;
}
