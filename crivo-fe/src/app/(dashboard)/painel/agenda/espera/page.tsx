import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { AgendaTabs } from "@/features/appointments/components/AgendaTabs";
import { WaitlistManagement } from "@/features/waitlist/components/WaitlistManagement";

export const metadata: Metadata = {
  title: "Lista de espera — Crivo",
};

const EsperaPage = () => {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6">Lista de espera</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Pacientes que querem ser avisados quando abrir uma vaga.
        </Typography>
      </Box>
      <AgendaTabs />
      <WaitlistManagement />
    </Stack>
  );
};

export default EsperaPage;
