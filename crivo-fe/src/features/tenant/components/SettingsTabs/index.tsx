"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

import { useIsAdmin } from "@/components/providers/session-provider";
import { MessageTemplates } from "../MessageTemplates";
import { TenantSettings } from "../TenantSettings";

type TabValue = "clinic" | "messages";

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
          <Tab label="Mensagens automáticas" value="messages" />
        </Tabs>
      </Box>

      {/* Montagem condicional: a aba de mensagens busca os templates ao
          montar, e deixá-la sempre no ar pagaria essa requisição em toda
          visita a Configurações. */}
      {tab === "clinic" && <TenantSettings />}
      {tab === "messages" && <MessageTemplates canManage={canManage} />}
    </Box>
  );
};
