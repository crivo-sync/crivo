import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ScheduleBoard } from "@/features/appointments/components/ScheduleBoard";
import { AgendaTabs } from "@/features/appointments/components/AgendaTabs";

export const metadata: Metadata = {
  title: "Quadro da agenda — Crivo",
};

const AgendaCalendarioPage = () => {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6">Agenda</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Agenda de todos os profissionais, colorida por pessoa. Use o painel
          de recursos, à esquerda, para esconder quem não interessa agora.
        </Typography>
      </Box>
      <AgendaTabs />
      <ScheduleBoard />
    </Stack>
  );
};

export default AgendaCalendarioPage;
