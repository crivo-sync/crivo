import { expect, type Page } from "@playwright/test";

/**
 * Contas do seed (`crivo-be/prisma/seed.ts`). Senha única de desenvolvimento.
 *
 * Os dois papéis existem porque metade das regras do sistema é sobre **o que
 * a recepção não pode fazer** — testar só com ADMIN deixaria essas regras
 * sem cobertura.
 */
export const USERS = {
  admin: {
    email: "admin@clinicasorriso.com.br",
    password: "senha12345",
  },
  staff: {
    email: "recepcao@clinicasorriso.com.br",
    password: "senha12345",
  },
} as const;

export type UserRole = keyof typeof USERS;

export async function login(page: Page, role: UserRole = "staff") {
  const user = USERS[role];

  await page.goto("/login");
  await page.getByLabel("E-mail").fill(user.email);
  await page.getByLabel("Senha").fill(user.password);
  await page.getByRole("button", { name: "Entrar" }).click();

  // Espera o painel de fato carregar: sem isto, o teste seguinte começaria
  // durante o redirect e falharia por corrida, não por regressão.
  await expect(page).toHaveURL(/\/painel/, { timeout: 20_000 });
}
