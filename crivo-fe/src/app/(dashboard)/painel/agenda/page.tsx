import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { AppointmentManagement } from "@/features/appointments/components/AppointmentManagement";

export const metadata: Metadata = {
  title: "Agenda — Crivo",
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
      <AppointmentManagement />
    </Stack>
  );
};

export default AgendaPage;
