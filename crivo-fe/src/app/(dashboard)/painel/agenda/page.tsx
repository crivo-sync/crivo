import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { AppointmentManagement } from "@/features/appointments/components/AppointmentManagement";
import { AgendaTabs } from "@/features/appointments/components/AgendaTabs";

export const metadata: Metadata = {
  title: "Agenda — Crivo Sync",
};

const AgendaPage = () => {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6">Agenda</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Agendamentos da clínica. Duração e preço vêm do procedimento
          escolhido.
        </Typography>
      </Box>
      <AgendaTabs />
      <AppointmentManagement />
    </Stack>
  );
};

export default AgendaPage;
