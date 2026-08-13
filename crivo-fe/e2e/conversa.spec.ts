import { expect, test, type Page } from "@playwright/test";

import { login } from "./support/auth";

/**
 * Aba "Conversa" da ficha do paciente.
 *
 * Existe porque a caixa de entrada só permitia **ler**: para responder, a
 * recepção abria o WhatsApp por fora do sistema, e aquela resposta não ficava
 * registrada em lugar nenhum. Estes testes cobrem o caminho da recepção —
 * abrir a conversa e responder.
 */

/**
 * Cria um paciente próprio a cada execução. Reusar alguém do seed faria as
 * mensagens se acumularem entre rodadas, e o teste passaria a depender do
 * estado deixado pela anterior.
 */
async function criarPaciente(page: Page): Promise<string> {
  const nome = `E2E Conversa ${Date.now()}`;

  await page.goto("/painel/pacientes");
  await page.getByRole("button", { name: /Novo paciente/i }).click();
  await page.getByLabel("Nome").fill(nome);
  await page.getByLabel(/Telefone/).fill("11991238877");
  await page.getByRole("button", { name: "Cadastrar" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  return nome;
}

async function abrirConversa(page: Page, nome: string) {
  await page.getByRole("gridcell", { name: nome }).click();
  await expect(page.getByRole("tab", { name: "Conversa" })).toBeVisible();
  await page.getByRole("tab", { name: "Conversa" }).click();
}

test.describe("Conversa com o paciente", () => {
  test("paciente sem histórico mostra aviso, não uma lista vazia sem explicação", async ({
    page,
  }) => {
    await login(page, "staff");
    const nome = await criarPaciente(page);
    await abrirConversa(page, nome);

    await expect(
      page.getByText("Nenhuma mensagem trocada com este paciente ainda."),
    ).toBeVisible();
  });

  test("a recepção responde e a mensagem entra na conversa", async ({
    page,
  }) => {
    await login(page, "staff");
    const nome = await criarPaciente(page);
    await abrirConversa(page, nome);

    const texto = `Olá! Podemos confirmar seu horário? ${Date.now()}`;
    await page
      .getByRole("textbox", { name: /Responder pelo WhatsApp/ })
      .fill(texto);
    await page.getByRole("button", { name: "Enviar" }).click();

    // "Na fila", não "enviada": o envio é assíncrono e pode falhar depois —
    // prometer entrega aqui seria a mentira que a lista de falhas desfaz.
    await expect(page.getByText("Mensagem na fila de envio.")).toBeVisible({
      timeout: 15_000,
    });

    // A bolha aparece com o texto e a legenda de mensagem manual.
    await expect(page.getByText(texto)).toBeVisible();
    await expect(page.getByText(/Resposta da clínica/).first()).toBeVisible();
  });

  test("não envia mensagem vazia", async ({ page }) => {
    await login(page, "staff");
    const nome = await criarPaciente(page);
    await abrirConversa(page, nome);

    // Botão travado com o campo vazio: barrar aqui evita uma ida à API para
    // receber 400 com o texto já digitado.
    await expect(page.getByRole("button", { name: "Enviar" })).toBeDisabled();

    // Só espaço em branco também não vale — `trim()` antes de habilitar.
    await page
      .getByRole("textbox", { name: /Responder pelo WhatsApp/ })
      .fill("   ");
    await expect(page.getByRole("button", { name: "Enviar" })).toBeDisabled();
  });

  test("a aba aparece para a recepção, diferente de Anamnese e Evolução", async ({
    page,
  }) => {
    await login(page, "staff");
    const nome = await criarPaciente(page);
    await page.getByRole("gridcell", { name: nome }).click();

    // Responder ao paciente é trabalho da recepção; prontuário não é dela.
    await expect(page.getByRole("tab", { name: "Conversa" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Anamnese" })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "Evolução" })).toHaveCount(0);
  });
});
