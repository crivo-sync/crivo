import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { SettingsTabs } from "@/features/tenant/components/SettingsTabs";

export const metadata: Metadata = {
  title: "Configurações — Crivo Sync",
};

const ConfiguracoesPage = () => {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6">Configurações</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Dados e identidade visual da clínica. Leitura liberada para todos;
          edição restrita a administradores.
        </Typography>
      </Box>
      <SettingsTabs />
    </Stack>
  );
};

export default ConfiguracoesPage;
