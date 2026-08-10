"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

const LIST_HREF = "/painel/agenda";
const CALENDAR_HREF = "/painel/agenda/calendario";
const RISK_HREF = "/painel/agenda/risco";
const WAITLIST_HREF = "/painel/agenda/espera";

/**
 * Os quatro ângulos da mesma agenda: lista, quadro, risco de falta e lista de
 * espera. São rotas de verdade (cada uma com sua própria URL), não abas de
 * estado local, para que o link seja compartilhável e o botão voltar do
 * navegador funcione.
 */
export const AgendaTabs = () => {
  const pathname = usePathname();

  // Comparação exata, não `startsWith`: `/painel/agenda` é prefixo de todas
  // as outras e marcaria "Lista" como ativa em qualquer uma delas.
  const value =
    [CALENDAR_HREF, RISK_HREF, WAITLIST_HREF].find(
      (href) => pathname === href,
    ) ?? LIST_HREF;

  return (
    <Tabs value={value} sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Tab label="Lista" component={Link} href={LIST_HREF} value={LIST_HREF} />
      <Tab
        label="Quadro"
        component={Link}
        href={CALENDAR_HREF}
        value={CALENDAR_HREF}
      />
      <Tab
        label="Risco de falta"
        component={Link}
        href={RISK_HREF}
        value={RISK_HREF}
      />
      <Tab
        label="Lista de espera"
        component={Link}
        href={WAITLIST_HREF}
        value={WAITLIST_HREF}
      />
    </Tabs>
  );
};
