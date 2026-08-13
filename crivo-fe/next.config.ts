import type { NextConfig } from "next";

/**
 * Domínios de túnel de desenvolvimento (ngrok, Cloudflare).
 *
 * Em dev o link de confirmação que vai no WhatsApp aponta para um túnel, e o
 * Next trata esse acesso como cross-origin — o que dispara **duas** proteções
 * diferentes, cada uma resolvida por uma opção abaixo (`allowedDevOrigins` e
 * `serverActions.allowedOrigins`).
 *
 * Diagnosticado em 13/08/2026, quando "Confirmar presença" não fazia nada
 * pelo link do WhatsApp e funcionava em localhost — sem erro na tela nem no
 * console do servidor.
 */
const TUNNEL_ORIGINS = ["*.ngrok-free.app", "*.ngrok.app", "*.trycloudflare.com"];

const nextConfig: NextConfig = {
  /**
   * Sem isto o painel **abre** pelo túnel mas nada funciona: o Next bloqueia
   * os assets de desenvolvimento em requisição cross-origin, o HMR falha
   * (WebSocket 503) e a página **não hidrata**. Como o React nunca anexa os
   * handlers, o botão "Confirmar presença" vira HTML estático — clicar não
   * faz nada e nenhum erro aparece, nem na tela nem no console do servidor.
   *
   * Vale só em desenvolvimento (a opção é ignorada em build de produção),
   * que é exatamente quando o acesso vem por um túnel.
   */
  allowedDevOrigins: TUNNEL_ORIGINS,
  experimental: {
    serverActions: {
      /**
       * O padrão do Next é 1MB, mas a importação de pacientes aceita CSV de
       * até 2MB (`MAX_CSV_SIZE_BYTES`, no crivo-be). Sem alinhar os dois, um
       * arquivo entre 1 e 2MB morre aqui com erro genérico de framework em
       * vez da mensagem tratada que o backend devolve.
       */
      bodySizeLimit: "2mb",
      /**
       * O Next compara `Origin` com `Host` e **aborta** a Server Action
       * quando diferem (proteção CSRF — ver `docs/01-app/02-guides/
       * data-security.md`). Pelo túnel eles nunca batem.
       *
       * Só fora de produção: lá o domínio é fixo, os headers batem, e
       * liberar curinga de túnel enfraqueceria o CSRF sem nenhum ganho.
       */
      ...(process.env.NODE_ENV === "production"
        ? {}
        : { allowedOrigins: TUNNEL_ORIGINS }),
    },
  },
};

export default nextConfig;
