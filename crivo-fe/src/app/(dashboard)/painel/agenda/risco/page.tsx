import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { AgendaTabs } from "@/features/appointments/components/AgendaTabs";
import { NoShowRiskList } from "@/features/prediction/components/NoShowRiskList";

export const metadata: Metadata = {
  title: "Risco de falta — Crivo",
};

const RiscoPage = () => {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6">Risco de falta</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Quem tem mais chance de faltar, primeiro. Pacientes de risco alto já
          recebem lembrete extra automaticamente.
        </Typography>
      </Box>
      <AgendaTabs />
      <NoShowRiskList />
    </Stack>
  );
};

export default RiscoPage;
