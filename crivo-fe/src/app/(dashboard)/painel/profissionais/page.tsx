import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ProfessionalManagement } from "@/features/professionals/components/ProfessionalManagement";

export const metadata: Metadata = {
  title: "Profissionais — Crivo Sync",
};

const ProfissionaisPage = () => {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6">Profissionais</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Equipe que atende na clínica. Apenas administradores podem cadastrar,
          editar ou remover.
        </Typography>
      </Box>
      <ProfessionalManagement />
    </Stack>
  );
};

export default ProfissionaisPage;
