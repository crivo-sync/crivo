import { MuiProvider } from "@/components/providers/mui-provider";

/**
 * A página de agendamento usa Material UI (não o Tailwind do site
 * institucional): o formulário tem select, data e estados de erro, que é
 * exatamente onde o MUI já resolve acessibilidade e teclado — e é o mesmo
 * visual do painel que a clínica conhece.
 *
 * Layout próprio porque a rota fica fora de `(website)` e `(dashboard)`: a
 * página é da clínica, sem header nem footer do Crivo.
 */
export default function AgendarLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <MuiProvider>{children}</MuiProvider>;
}
