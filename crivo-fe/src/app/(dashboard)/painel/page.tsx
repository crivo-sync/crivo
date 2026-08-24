import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { DashboardHome } from "@/features/dashboard/components/DashboardHome";
import { OnboardingChecklist } from "@/features/tenant/components/OnboardingChecklist";

export const metadata: Metadata = {
  title: "Painel — Crivo Sync",
};

const DashboardPage = () => {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6">Painel</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Visão geral do dia na clínica.
        </Typography>
      </Box>
      {/* Antes do resumo do dia: clínica que ainda não configurou nada vê um
          painel todo zerado, e o checklist é o que explica o porquê. Some
          sozinho quando a clínica está operando. */}
      <OnboardingChecklist />
      <DashboardHome />
    </Stack>
  );
};

export default DashboardPage;
