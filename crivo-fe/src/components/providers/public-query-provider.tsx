"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

type PublicQueryProviderProps = {
  children: React.ReactNode;
};

/**
 * Versão enxuta do `QueryProvider` do painel, para páginas públicas (site
 * institucional). Sem a detecção de sessão expirada: aqui não há usuário
 * logado, então `logoutAction()` nunca se aplicaria.
 */
export const PublicQueryProvider = ({ children }: PublicQueryProviderProps) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
