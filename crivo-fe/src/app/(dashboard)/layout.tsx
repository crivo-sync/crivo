import { redirect } from "next/navigation";

import { MuiProvider } from "@/components/providers/mui-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { SessionProvider } from "@/components/providers/session-provider";
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
          >
            {children}
          </DashboardShell>
        </QueryProvider>
      </SessionProvider>
    </MuiProvider>
  );
}
