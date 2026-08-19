import { redirect } from "next/navigation";

import { MuiProvider } from "@/components/providers/mui-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { getTenantAction } from "@/features/tenant/actions/get-tenant-action";
import { getSession, SESSION_EXPIRED_MESSAGE } from "@/lib/session";
import { DashboardShell } from "./_components/dashboard-shell";
import { NAV_ITEMS } from "./_data/nav-items";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(session.role),
  );

  /**
   * Nome da clínica é exibido no header; se a chamada falhar por rede
   * (backend fora do ar), o painel continua funcionando sem ele.
   *
   * **Sessão recusada é diferente de rede fora** e precisa de outro
   * desfecho: sem isto, quem chegava aqui com cookie inválido via a casca
   * do painel montada com "Minha conta" no lugar do nome e um erro técnico
   * em inglês no meio da tela (com a URL interna da API à mostra). O
   * `middleware.ts` cobre a maioria dos casos, mas deixa passar de
   * propósito quando o backend não responde — e é justamente aí que a
   * sessão morta chegava ao render.
   */
  const tenantResult = await getTenantAction();

  if (!tenantResult.success && tenantResult.message === SESSION_EXPIRED_MESSAGE) {
    redirect("/login");
  }

  const tenantName = tenantResult.success ? tenantResult.data.name : null;
  const trial = tenantResult.success
    ? {
        status: tenantResult.data.subscriptionStatus,
        endsAt: tenantResult.data.trialEndsAt,
      }
    : null;

  return (
    <MuiProvider>
      <SessionProvider
        session={{
          userId: session.userId,
          role: session.role,
          displayName: session.displayName,
        }}
      >
        <QueryProvider>
          <DashboardShell
            navItems={visibleItems}
            displayName={session.displayName ?? "Minha conta"}
            tenantName={tenantName}
            trial={trial}
          >
            {children}
          </DashboardShell>
        </QueryProvider>
      </SessionProvider>
    </MuiProvider>
  );
}
