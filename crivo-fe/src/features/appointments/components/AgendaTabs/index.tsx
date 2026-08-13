"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Tooltip from "@mui/material/Tooltip";
import LockIcon from "@mui/icons-material/Lock";

import { usePlanFeatures } from "@/features/tenant/hooks/use-plan-features";

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
  const { has, planName } = usePlanFeatures();

  const canRisk = has("hasPrediction");
  const canWaitlist = has("hasWaitlist");

  /**
   * Aba sem direito continua visível, com cadeado — não sumindo.
   *
   * Esconder deixaria a clínica sem saber que o recurso existe, e é
   * justamente essa a diferença entre o plano dela e o de cima. O cadeado
   * informa e vende; o sumiço só empobrece a tela.
   */
  const lockedProps = (label: string) => ({
    label,
    icon: <LockIcon sx={{ fontSize: 14 }} />,
    iconPosition: "end" as const,
    disabled: true,
    sx: { opacity: 0.55 },
  });

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
      {canRisk ? (
        <Tab
          label="Risco de falta"
          component={Link}
          href={RISK_HREF}
          value={RISK_HREF}
        />
      ) : (
        <Tooltip title={`Disponível a partir do plano Intermediário — o ${planName} não inclui.`}>
          {/* `<span>` porque Tooltip não dispara em elemento desabilitado. */}
          <span>
            <Tab {...lockedProps("Risco de falta")} value={RISK_HREF} />
          </span>
        </Tooltip>
      )}
      {canWaitlist ? (
        <Tab
          label="Lista de espera"
          component={Link}
          href={WAITLIST_HREF}
          value={WAITLIST_HREF}
        />
      ) : (
        <Tooltip title={`Disponível a partir do plano Intermediário — o ${planName} não inclui.`}>
          <span>
            <Tab {...lockedProps("Lista de espera")} value={WAITLIST_HREF} />
          </span>
        </Tooltip>
      )}
    </Tabs>
  );
};
