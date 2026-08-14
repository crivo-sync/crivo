"use client";

import { useState } from "react";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import { logoutAction } from "@/features/auth/actions/logout-action";
import { SESSION_EXPIRED_MESSAGE } from "@/lib/session-messages";

type QueryProviderProps = {
  children: React.ReactNode;
};

/**
 * QueryClient instanciado por componente (não em módulo top-level) para
 * evitar vazar cache entre requisições diferentes no SSR do Next.
 *
 * `queryCache`/`mutationCache` centralizam a detecção de sessão expirada:
 * ANTES, cada hook de leitura chamava `useSessionExpiredGuard(error)`
 * manualmente — cobria queries, mas nenhuma das ~20 mutations do projeto
 * (editar perfil, trocar senha, criar paciente, etc.) tinha a mesma
 * checagem, então uma sessão morta numa ação de escrita só mostrava o
 * snackbar de erro genérico e nunca deslogava. Um `onError` aqui, uma vez,
 * cobre toda query E mutation do app — nenhum hook novo precisa lembrar de
 * adicionar isso.
 */
export const QueryProvider = ({ children }: QueryProviderProps) => {
  const [queryClient] = useState(() => {
    // Objeto plain (não `useRef`): a factory do `useState` roda durante o
    // render/mount, e o React Compiler bloqueia leitura de `ref.current`
    // nesse ponto. Este flag não precisa disparar re-render — só evitar
    // logout duplicado se duas queries falharem quase juntas — então uma
    // variável mutável comum, fechada no closure abaixo, resolve sem violar
    // a regra de refs.
    const handledState = { handled: false };

    const handleAuthError = (error: unknown) => {
      const message = error instanceof Error ? error.message : undefined;
      if (message !== SESSION_EXPIRED_MESSAGE || handledState.handled) return;

      handledState.handled = true;
      // Navegação de página completa em vez de `router.push` + `router.refresh`:
      // com a sessão já morta, o refresh re-buscava o RSC do /painel e o
      // middleware respondia com um redirect que o router cliente não sabia
      // interpretar — o painel travava em "An unexpected response was received
      // from the server." em vez de cair na tela de login.
      void logoutAction();
      window.location.assign("/login");
    };

    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30 * 1000,
          refetchOnWindowFocus: false,
          retry: 1,
        },
      },
      queryCache: new QueryCache({ onError: handleAuthError }),
      mutationCache: new MutationCache({ onError: handleAuthError }),
    });
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
