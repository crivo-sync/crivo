"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

const LIST_HREF = "/painel/agenda";
const CALENDAR_HREF = "/painel/agenda/calendario";

/**
 * Alterna entre a lista de agendamentos e o quadro visual — são duas rotas
 * de verdade (cada uma com sua própria URL), não abas de estado local, para
 * que o link seja compartilhável e o botão voltar do navegador funcione.
 */
export const AgendaTabs = () => {
  const pathname = usePathname();
  const value = pathname === CALENDAR_HREF ? CALENDAR_HREF : LIST_HREF;

  return (
    <Tabs value={value} sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Tab label="Lista" component={Link} href={LIST_HREF} value={LIST_HREF} />
      <Tab
        label="Quadro"
        component={Link}
        href={CALENDAR_HREF}
        value={CALENDAR_HREF}
      />
    </Tabs>
  );
};
