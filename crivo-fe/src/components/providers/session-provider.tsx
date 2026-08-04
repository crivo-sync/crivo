"use client";

import { createContext, useContext } from "react";

import type { SessionRole } from "@/lib/session";

export type ClientSession = {
  userId: string;
  role: SessionRole;
  displayName: string | null;
};

const SessionContext = createContext<ClientSession | null>(null);

/**
 * Expõe a sessão (já resolvida no servidor pelo layout do dashboard) aos
 * componentes client, para decisões de UI como esconder/desabilitar ações
 * restritas a ADMIN.
 *
 * **Isto não é uma barreira de segurança.** Qualquer checagem feita aqui é
 * uma dica de interface: a autorização real acontece no crivo-be
 * (`@Roles(...)`) e, antes dele, na Server Action correspondente
 * (`requireAdmin()` em `src/lib/session.ts`).
 */
export const SessionProvider = ({
  session,
  children,
}: {
  session: ClientSession;
  children: React.ReactNode;
}) => {
  return (
    <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
  );
};

export function useSession(): ClientSession {
  const session = useContext(SessionContext);
  if (!session) {
    throw new Error("useSession precisa estar dentro de <SessionProvider>.");
  }
  return session;
}

/** Atalho para o caso mais comum: liberar ações de escrita só para ADMIN. */
export function useIsAdmin(): boolean {
  return useSession().role === "ADMIN";
}

/**
 * Quem tem necessidade clínica — usado para esconder as abas de prontuário
 * da recepção. Espelha `requireClinical()` em `lib/session.ts`, e ambos são
 * só conveniência: a autoridade é o `@Roles` do crivo-be.
 */
export function useIsClinical(): boolean {
  const { role } = useSession();
  return role === "ADMIN" || role === "PROFESSIONAL";
}

const ROLE_LABELS: Record<SessionRole, string> = {
  ADMIN: "Administrador",
  PROFESSIONAL: "Profissional",
  STAFF: "Recepção",
};

export function roleLabel(role: SessionRole): string {
  return ROLE_LABELS[role];
}
