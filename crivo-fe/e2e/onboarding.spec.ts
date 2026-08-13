import { expect, test, type Page } from "@playwright/test";

import { login } from "./support/auth";

/**
 * Checklist de onboarding no `/painel`.
 *
 * Clínica criada pelo cadastro self-service nasce sem profissional e sem
 * procedimento — e sem os dois a agenda não calcula horário e o `/agendar`
 * que ela divulga responde "Agenda ainda não disponível". Antes deste card,
 * nada no painel dizia isso: o painel abria todo zerado, sem explicação, e a
 * clínica descobria pelo paciente reclamando que o link não funciona.
 */

const TITULO = "Falta pouco para sua agenda funcionar";

/** Cria uma clínica nova pelo cadastro real e entra com ela. */
async function cadastrarClinicaNova(page: Page): Promise<string> {
  const slug = `onb-${Date.now()}`;

  const registro = await page.request.post(
    "http://localhost:3333/auth/register",
    {
      data: {
        tenantName: "Clínica Recém-Criada",
        subdomain: slug,
        name: "Dono da Clínica",
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

  return slug;
}

test.describe("Onboarding da clínica nova", () => {
  test("clínica recém-criada vê o checklist com os três passos pendentes", async ({
    page,
  }) => {
    await cadastrarClinicaNova(page);

    await expect(page.getByText(TITULO)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("0 de 3")).toBeVisible();

    await expect(page.getByText("Cadastre quem atende")).toBeVisible();
    await expect(page.getByText("Cadastre os procedimentos")).toBeVisible();
    await expect(page.getByText("Marque o primeiro atendimento")).toBeVisible();
  });

  test("avisa que o link de agendamento ainda não funciona", async ({
    page,
  }) => {
    const slug = await cadastrarClinicaNova(page);

    await expect(page.getByText(TITULO)).toBeVisible({ timeout: 15_000 });

    // O link aparece desde o começo — divulgar antes de ter profissional e
    // procedimento é exatamente como a clínica descobre o problema pelo
    // paciente. Por isso vem com o aviso junto.
    await expect(page.getByText(`/agendar/${slug}`)).toBeVisible();
    await expect(
      page.getByText(/Este link ainda não aceita agendamento/),
    ).toBeVisible();
  });

  test("o primeiro passo pendente leva para a tela de profissionais", async ({
    page,
  }) => {
    await cadastrarClinicaNova(page);

    await expect(page.getByText(TITULO)).toBeVisible({ timeout: 15_000 });
    await page.getByRole("link", { name: "Cadastrar profissional" }).click();

    await expect(page).toHaveURL(/\/painel\/profissionais/);
  });

  test("clínica já operando não vê o checklist", async ({ page }) => {
    // A do seed tem profissional, procedimento e agendamentos — o card é de
    // partida, não um painel permanente.
    await login(page, "staff");

    await expect(page.getByRole("heading", { name: "Painel" })).toBeVisible();
    await expect(page.getByText(TITULO)).toHaveCount(0);
  });
});
