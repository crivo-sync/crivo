"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

import { useIsAdmin } from "@/components/providers/session-provider";
import { SubscriptionSettings } from "@/features/billing/components/SubscriptionSettings";
import { MessageTemplates } from "../MessageTemplates";
import { TenantSettings } from "../TenantSettings";
import { WhatsAppConnection } from "../WhatsAppConnection";

type TabValue = "clinic" | "whatsapp" | "messages" | "subscription";

const TAB_VALUES: TabValue[] = ["clinic", "whatsapp", "messages", "subscription"];

function isTabValue(value: string | null): value is TabValue {
  return TAB_VALUES.includes(value as TabValue);
}

/**
 * Separa "dados da clínica" de "textos das mensagens".
 *
 * Os textos são longos e têm pré-visualização; empilhados abaixo do
 * formulário deixariam a tela com rolagem infinita e esconderiam o botão de
 * salvar dos dados da clínica.
 */
export const SettingsTabs = () => {
  const searchParams = useSearchParams();
  /**
   * `?tab=subscription` na URL abre direto na aba certa — sem isso, um link
   * de "faça upgrade em Configurações → Assinatura" (achado no alerta de
   * excedente de profissionais) sempre caía em "Dados da clínica", porque a
   * aba vivia só em estado local. Lido uma vez, na primeira renderização:
   * depois disso o clique do usuário manda, a URL não fica "puxando" a aba
   * de volta a cada novo parâmetro.
   */
  const [tab, setTab] = useState<TabValue>(() => {
    const fromUrl = searchParams.get("tab");
    return isTabValue(fromUrl) ? fromUrl : "clinic";
  });
  const canManage = useIsAdmin();

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tab} onChange={(_, value: TabValue) => setTab(value)}>
          <Tab label="Dados da clínica" value="clinic" />
          {/* Escondida para STAFF: no backend até a **leitura** é ADMIN
              (`whatsapp-connection` responde 403), então a aba abriria só
              para mostrar erro. */}
          {canManage && <Tab label="WhatsApp" value="whatsapp" />}
          <Tab label="Mensagens automáticas" value="messages" />
          <Tab label="Assinatura" value="subscription" />
        </Tabs>
      </Box>

      {/* Montagem condicional: cada aba busca seus próprios dados ao montar,
          e deixá-las todas no ar pagaria essa requisição em toda visita a
          Configurações. */}
      {tab === "clinic" && <TenantSettings />}
      {tab === "whatsapp" && canManage && <WhatsAppConnection />}
      {tab === "messages" && <MessageTemplates canManage={canManage} />}
      {tab === "subscription" && <SubscriptionSettings />}
    </Box>
  );
};
