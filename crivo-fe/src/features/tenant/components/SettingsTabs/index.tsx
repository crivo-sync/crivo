"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

import { useIsAdmin } from "@/components/providers/session-provider";
import { SubscriptionSettings } from "@/features/billing/components/SubscriptionSettings";
import { MessageTemplates } from "../MessageTemplates";
import { TenantSettings } from "../TenantSettings";
import { WhatsAppConnection } from "../WhatsAppConnection";

type TabValue = "clinic" | "whatsapp" | "messages" | "subscription";

/**
 * Separa "dados da clínica" de "textos das mensagens".
 *
 * Os textos são longos e têm pré-visualização; empilhados abaixo do
 * formulário deixariam a tela com rolagem infinita e esconderiam o botão de
 * salvar dos dados da clínica.
 */
export const SettingsTabs = () => {
  const [tab, setTab] = useState<TabValue>("clinic");
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
