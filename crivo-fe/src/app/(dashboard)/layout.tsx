import { redirect } from "next/navigation";

import { MuiProvider } from "@/components/providers/mui-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { getTenantAction } from "@/features/tenant/actions/get-tenant-action";
import { getSession } from "@/lib/session";
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

  // Nome da clínica é exibido no header; se a chamada falhar (sessão prestes
  // a expirar, backend fora do ar), o painel continua funcionando sem ele.
  const tenantResult = await getTenantAction();
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
