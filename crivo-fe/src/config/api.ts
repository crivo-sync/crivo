import ky from "ky";
import type { HTTPError, KyInstance } from "ky";

export { type KyInstance };

/**
 * Headers de autenticação compartilhados por toda requisição autenticada.
 * O tenant nunca vai aqui: o crivo-be sempre o extrai do próprio token
 * (`TenantContextGuard`), nunca do body ou da URL.
 */
export function authHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

/**
 * Instância ky única, apontando direto para o crivo-be.
 *
 * - Sem injeção de auth aqui — endpoints públicos (login, register) usam
 *   esta instância direto.
 * - Server Actions que precisam de token estendem a chamada passando
 *   `{ headers: authHeaders(accessToken) }`.
 */
export const api: KyInstance = ky.extend({
  prefix: API_URL,
  timeout: 15_000,
  retry: 0,
  cache: "no-store",
  headers: {
    Accept: "application/json",
  },
  hooks: {
    // Troca a mensagem crua do ky ("Request failed with status code 400 …")
    // pela mensagem amigável que o crivo-be devolve no corpo — é ela que
    // chega na UI (validação de campo, limite de plano, colisão de horário…).
    beforeError: [
      ({ error }) => {
        const httpError = error as HTTPError;

        /**
         * Sem `response` = falha de rede (backend fora do ar, DNS, timeout).
         * A mensagem crua do ky carrega a URL interna da API — e ela chegava
         * inteira na tela do usuário: *"Request failed due to a network
         * error: GET http://localhost:3333/tenants/me"*. Além de não dizer
         * nada a quem lê, expõe endereço de infraestrutura numa tela de
         * clínica.
         *
         * A URL continua no log do servidor (`console.error` das actions),
         * que é onde ela serve para depurar.
         */
        if (!httpError.response) {
          httpError.message =
            "Não foi possível falar com o servidor. Verifique sua conexão e tente de novo.";
          return httpError;
        }

        // No ky v2 o corpo já chega pré-parsed em `error.data` — e o
        // `response` é consumido ao populá-lo, então `response.json()` não
        // funciona aqui. Sem `error.data` mantemos a mensagem padrão do ky.
        const body = httpError.data as
          | { message?: string | string[] }
          | undefined;
        const message = Array.isArray(body?.message)
          ? body.message.join(", ")
          : body?.message;
        if (message) httpError.message = message;
        return httpError;
      },
    ],
  },
});
