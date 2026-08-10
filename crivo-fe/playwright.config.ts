import { defineConfig, devices } from "@playwright/test";

/**
 * E2E do painel.
 *
 * Roda contra o **backend de verdade** (`crivo-be` + Postgres + Redis), não
 * contra mocks: os bugs que estes testes existem para pegar — confirmação
 * ignorada, lembrete de consulta cancelada — nasceram justamente na costura
 * entre as duas pontas, e mock nenhum teria pego.
 *
 * Pré-requisitos (ver `e2e/README.md`):
 *   docker compose up -d      # postgres + redis
 *   npm run start:dev         # no crivo-be, porta 3333
 */
export default defineConfig({
  testDir: "./e2e",
  // Sem paralelismo: os testes compartilham o mesmo banco, e dois workers
  // criando agendamento no mesmo horário disputariam a mesma vaga.
  fullyParallel: false,
  workers: 1,
  // Um retry cobre lentidão pontual da fila; mais que isso mascararia teste
  // instável, que é pior que teste ausente.
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  expect: { timeout: 15_000 },

  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    // Só guarda evidência do que falhou — em teste verde isso é lixo.
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],

  // Sobe o Next sozinho, reusando o servidor já aberto em desenvolvimento.
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
