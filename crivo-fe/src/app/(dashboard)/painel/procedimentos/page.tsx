import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ProcedureManagement } from "@/features/procedures/components/ProcedureManagement";

export const metadata: Metadata = {
  title: "Procedimentos — Crivo Sync",
};

const ProcedimentosPage = () => {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6">Procedimentos</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Catálogo de procedimentos da clínica. Apenas administradores podem
          cadastrar, editar ou remover.
        </Typography>
      </Box>
      <ProcedureManagement />
    </Stack>
  );
};

export default ProcedimentosPage;
