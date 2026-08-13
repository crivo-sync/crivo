import { expect, test, type Page } from "@playwright/test";

/**
 * A página que o paciente usa sozinho, sem login (`/agendar/:subdomain`).
 *
 * O backend dela existia e estava testado desde 10/08/2026, mas a tela não
 * — os quatro planos anunciavam "agendamento online" e não havia para onde
 * mandar ninguém. Estes testes cobrem justamente o caminho que ninguém do
 * time percorre no dia a dia: o do paciente.
 */

const CLINICA = "clinica-sorriso";

/** Nome único por execução: rodar duas vezes não acumula o mesmo paciente. */
const pacienteTeste = () => `E2E Online ${Date.now()}`;

/**
 * Preenche a cascata e para no primeiro dia com horário livre.
 *
 * Procura o dia em vez de fixar um: a agenda do seed enche com o uso
 * repetido da suíte, e um dia lotado faria o teste falhar por dado
 * saturado — não por regressão.
 */
async function escolherPrimeiraOpcao(page: Page, label: string) {
  // `TextField select` do MUI não é `<select>` nativo: é um combobox que
  // abre um listbox em portal. `selectOption` não funciona aqui.
  await page.getByRole("combobox", { name: label }).click();
  await page.getByRole("option").first().click();
}

/**
 * O campo "Dia" do MUI DatePicker expõe **três** elementos com o mesmo
 * rótulo (o grupo, os spinbuttons dos segmentos e um input escondido), e
 * `getByLabel` casa com os três.
 *
 * Uso o `spinbutton` porque é ele que carrega `aria-disabled` — no `group`
 * o MUI só põe a classe `Mui-disabled`, que o Playwright (corretamente) não
 * lê como estado desabilitado. Mesmo padrão de `e2e/agendamento.spec.ts`.
 */
const campoDia = (page: Page) => page.getByRole("spinbutton", { name: "Dia" });

/**
 * Digita a data no campo segmentado do MUI.
 *
 * `fill()` não serve: o campo é composto por spinbuttons (DD/MM/AAAA), não
 * um `<input>` de texto. Clicar e digitar é o que o paciente faz de fato.
 */
async function preencherDia(page: Page, data: string) {
  await campoDia(page).click();
  await page.keyboard.type(data.replace(/\D/g, ""));
}

/** `DD/MM/AAAA` de hoje + `offset` dias. */
function proximoDia(offset: number): string {
  const data = new Date();
  data.setDate(data.getDate() + offset);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(data.getDate())}/${pad(data.getMonth() + 1)}/${data.getFullYear()}`;
}

async function escolherPrimeiroHorario(page: Page): Promise<boolean> {
  await escolherPrimeiraOpcao(page, "Com quem você quer atendimento");
  await escolherPrimeiraOpcao(page, "O que você precisa");

  const horarios = page.locator("button[aria-pressed]");

  for (let offset = 3; offset <= 30; offset += 1) {
    await preencherDia(page, proximoDia(offset));

    // Espera curta: dia sem vaga responde rápido, e um timeout longo aqui
    // multiplicaria por 28 tentativas.
    await page.waitForTimeout(700);
    if ((await horarios.count()) > 0) {
      await horarios.first().click();
      return true;
    }
  }

  return false;
}

test.describe("Agendamento online (paciente)", () => {
  test("clínica inexistente não abre formulário", async ({ page }) => {
    const response = await page.goto("/agendar/clinica-que-nao-existe");

    expect(response?.status()).toBe(404);
  });

  test("a página abre identificando a clínica", async ({ page }) => {
    await page.goto(`/agendar/${CLINICA}`);

    // Clínica com logo cadastrado mostra a imagem (nome no `alt`), não um
    // `<h1>` — o `<h1>` é o fallback de quem não tem logo. `getByRole`
    // cobre os dois casos sem depender de qual está em uso no seed.
    await expect(
      page.getByRole("img", { name: "Clínica Sorriso" }),
    ).toBeVisible();
    await expect(page.getByLabel("Com quem você quer atendimento")).toBeVisible();
  });

  test("clínica sem profissional avisa em vez de mostrar formulário morto", async ({
    page,
  }) => {
    // Clínica recém-cadastrada não tem profissional nem procedimento, e sem
    // os dois não existe horário para oferecer. Antes deste aviso o paciente
    // encarava um formulário que nunca funcionaria — e a clínica não
    // descobria que o link divulgado estava quebrado.
    //
    // Cria a clínica pelo cadastro real em vez de interceptar a rede: as
    // opções são buscadas por Server Action no servidor, então `page.route`
    // (que só enxerga requisição do navegador) não as alcança.
    const slug = `vazia-${Date.now()}`;
    const registro = await page.request.post(
      "http://localhost:3333/auth/register",
      {
        data: {
          tenantName: "Clínica Sem Agenda",
          subdomain: slug,
          name: "Dona da Clínica",
          email: `${slug}@teste.com`,
          phone: "11988887777",
          password: "senha12345",
        },
      },
    );
    expect(registro.ok()).toBe(true);

    await page.goto(`/agendar/${slug}`);

    await expect(page.getByText("Agenda ainda não disponível")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Confirmar agendamento" }),
    ).toHaveCount(0);
  });

  test("os campos abrem em cascata, não todos de uma vez", async ({ page }) => {
    await page.goto(`/agendar/${CLINICA}`);

    // Sem profissional, procedimento e dia ficam travados: a lista de
    // procedimentos depende de quem atende, e sem os dois não há como
    // calcular horário livre.
    //
    // O combobox desabilitado do MUI não expõe `disabled` no elemento com
    // role — o estado aparece como `aria-disabled`.
    const procedimento = page.getByRole("combobox", {
      name: "O que você precisa",
    });
    await expect(procedimento).toHaveAttribute("aria-disabled", "true");
    await expect(campoDia(page)).toBeDisabled();

    await escolherPrimeiraOpcao(page, "Com quem você quer atendimento");
    await expect(procedimento).not.toHaveAttribute("aria-disabled", "true");
    await expect(campoDia(page)).toBeDisabled();

    await escolherPrimeiraOpcao(page, "O que você precisa");
    await expect(campoDia(page)).toBeEnabled();
  });

  test("o paciente marca a consulta sozinho", async ({ page }) => {
    await page.goto(`/agendar/${CLINICA}`);

    const achou = await escolherPrimeiroHorario(page);
    expect(
      achou,
      "Nenhum dia com vaga nos próximos 30 dias — a agenda do seed pode estar saturada. Rode `npm run prisma:seed:clean && npm run prisma:seed` no crivo-be.",
    ).toBe(true);

    await page.getByLabel("Seu nome").fill(pacienteTeste());
    await page.getByLabel("WhatsApp").fill("11999887766");

    await page.getByRole("button", { name: "Confirmar agendamento" }).click();

    await expect(page.getByText("Consulta marcada")).toBeVisible({
      timeout: 15000,
    });
  });

  test("a confirmação conta o tempo do WhatsApp e depois diz o que fazer", async ({
    page,
  }) => {
    await page.goto(`/agendar/${CLINICA}`);

    const achou = await escolherPrimeiroHorario(page);
    test.skip(!achou, "agenda do seed sem vaga");

    await page.getByLabel("Seu nome").fill(pacienteTeste());
    await page.getByLabel("WhatsApp").fill("11999887766");
    await page.getByRole("button", { name: "Confirmar agendamento" }).click();

    await expect(page.getByText("Consulta marcada")).toBeVisible({
      timeout: 15000,
    });

    // Enquanto conta, a barra explica a espera em vez de deixar o paciente
    // sem saber se a mensagem saiu.
    await expect(
      page.getByText(/Enviando a confirmação no seu WhatsApp/),
    ).toBeVisible();
    await expect(page.getByRole("progressbar")).toBeVisible();

    // Ao zerar, vira orientação de fallback — o caso real de quando o
    // WhatsApp da clínica está fora do ar. `toBeVisible` espera sozinho, sem
    // `waitForTimeout` fixo.
    await expect(page.getByText(/Se a mensagem não chegou/)).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("progressbar")).toHaveCount(0);
  });

  test("dá para marcar outra consulta sem recarregar a página", async ({
    page,
  }) => {
    await page.goto(`/agendar/${CLINICA}`);

    const achou = await escolherPrimeiroHorario(page);
    test.skip(!achou, "agenda do seed sem vaga");

    await page.getByLabel("Seu nome").fill(pacienteTeste());
    await page.getByLabel("WhatsApp").fill("11999887766");
    await page.getByRole("button", { name: "Confirmar agendamento" }).click();
    await expect(page.getByText("Consulta marcada")).toBeVisible({
      timeout: 15000,
    });

    await page.getByRole("button", { name: "Marcar outra consulta" }).click();

    // Volta ao formulário ZERADO: manter a seleção anterior faria a pessoa
    // remarcar o mesmo horário sem perceber.
    const profissional = page.getByRole("combobox", {
      name: "Com quem você quer atendimento",
    });
    await expect(profissional).toBeVisible();
    await expect(profissional).toHaveText("");
    await expect(
      page.getByRole("button", { name: "Confirmar agendamento" }),
    ).toBeDisabled();
  });

  test("não confirma sem telefone completo", async ({ page }) => {
    await page.goto(`/agendar/${CLINICA}`);

    const achou = await escolherPrimeiroHorario(page);
    test.skip(!achou, "agenda do seed sem vaga");

    await page.getByLabel("Seu nome").fill("Telefone Incompleto");
    await page.getByLabel("WhatsApp").fill("1199");

    // O backend exige 10 ou 11 dígitos; barrar aqui evita uma ida à API
    // para receber 400 com o formulário já preenchido.
    await expect(
      page.getByRole("button", { name: "Confirmar agendamento" }),
    ).toBeDisabled();
  });
});
