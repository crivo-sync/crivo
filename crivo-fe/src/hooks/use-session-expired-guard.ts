"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { logoutAction } from "@/features/auth/actions/logout-action";
import { SESSION_EXPIRED_MESSAGE } from "@/lib/session-messages";

/**
 * Detecta a mensagem estável de sessão expirada (`SESSION_EXPIRED_MESSAGE`,
 * devolvida por toda Server Action quando `getServerSession()`/`getSession()`
 * não encontra token) e força logout + redirect para `/login` sem exigir
 * refresh manual da página.
 *
 * Uso: passe o `error` de um `useQuery` (ou qualquer `Error | null`) de cada
 * feature de leitura. `useRef` evita disparar o logout mais de uma vez se o
 * componente re-renderizar com o mesmo erro antes do redirect completar.
 */
export function useSessionExpiredGuard(error: unknown) {
  const router = useRouter();
  const handledRef = useRef(false);

  useEffect(() => {
    const message = error instanceof Error ? error.message : undefined;
    if (message !== SESSION_EXPIRED_MESSAGE || handledRef.current) return;

    handledRef.current = true;
    void logoutAction().then(() => {
      router.push("/login");
      router.refresh();
    });
  }, [error, router]);
}
