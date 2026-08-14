import { expect, test } from "@playwright/test";

import { login } from "./support/auth";

/**
 * Conectar o WhatsApp da clínica lendo um QR code.
 *
 * Antes disto, o vínculo era um campo de texto onde a clínica digitava o
 * "nome da instância" da Evolution — impossível de responder sem alguém do
 * time no meio, e ainda permitia digitar o nome da instância de **outra**
 * clínica. Estes testes cobrem o caminho de quem assina sozinho.
 *
 * Rodam contra a Evolution API real: o QR é gerado de verdade.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

async function abrirAbaWhatsApp(page: import("@playwright/test").Page) {
  await page.goto("/painel/configuracoes");
  await page.getByRole("tab", { name: "WhatsApp" }).click();
}

/**
 * Zera a conexão direto pela API antes de cada teste.
 *
 * Sem isto, o teste do QR deixa a clínica em "Aguardando leitura" e o
 * seguinte encontra um estado que não é o que ele descreve — teste que passa
 * ou falha conforme a ordem é pior que teste ausente.
 */
async function zerarConexao(request: import("@playwright/test").APIRequestContext) {
  const login = await request.post(`${API_URL}/auth/login`, {
    data: {
      email: "admin@clinicasorriso.com.br",
      password: "senha12345",
    },
  });

  const { accessToken } = (await login.json()) as { accessToken: string };

  await request.delete(`${API_URL}/whatsapp-connection`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

test.describe("Conexão do WhatsApp", () => {
  test.beforeEach(async ({ request }) => {
    await zerarConexao(request);
  });

  test("a recepção não vê a aba — nem para ler", async ({ page }) => {
    await login(page, "staff");
    await page.goto("/painel/configuracoes");

    // No backend até o GET é ADMIN: mostrar a aba abriria só para dar 403.
    await expect(
      page.getByRole("tab", { name: "WhatsApp" }),
    ).toHaveCount(0);
  });

  test("clínica sem WhatsApp é avisada do que deixa de funcionar", async ({
    page,
  }) => {
    await login(page, "admin");
    await abrirAbaWhatsApp(page);

    const painel = page.getByRole("main");

    // "Desconectado" sozinho não diz a consequência — e a consequência é
    // invisível: a clínica só descobriria quando alguém faltasse.
    await expect(painel).toContainText("não recebem lembrete", {
      timeout: 15_000,
    });
    await expect(
      page.getByRole("button", { name: /conectar whatsapp/i }),
    ).toBeVisible();
  });

  test("conectar mostra um QR de verdade e as instruções", async ({ page }) => {
    test.setTimeout(60_000);

    await login(page, "admin");
    await abrirAbaWhatsApp(page);

    // O `beforeEach` garante que a clínica começa desconectada.
    await page.getByRole("button", { name: /conectar whatsapp/i }).click();

    const qr = page.getByRole("img", { name: /qr code/i });
    await expect(qr).toBeVisible({ timeout: 30_000 });

    // Imagem real, não um placeholder quebrado.
    const src = await qr.getAttribute("src");
    expect(src).toMatch(/^data:image\/png;base64,/);
    expect((src ?? "").length).toBeGreaterThan(1000);

    // Sem os passos, "aponte a câmera" não diz onde no WhatsApp procurar.
    await expect(page.getByRole("main")).toContainText(
      "Dispositivos conectados",
    );
  });

  test("a tela não expõe o nome da instância", async ({ page }) => {
    await login(page, "admin");
    await abrirAbaWhatsApp(page);

    // É detalhe do servidor Evolution: não ajuda a clínica em nada, mas
    // ajudaria quem quisesse alcançar a instância de outra.
    const conteudo = await page.getByRole("main").innerText();

    expect(conteudo).not.toContain("crivo-");
    expect(conteudo.toLowerCase()).not.toContain("instância da evolution");
  });
});
