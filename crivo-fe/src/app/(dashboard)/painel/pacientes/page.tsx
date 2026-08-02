import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { PatientManagement } from "@/features/patients/components/PatientManagement";

export const metadata: Metadata = {
  title: "Pacientes — Crivo",
};

const PacientesPage = () => {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6">Pacientes</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Cadastro e histórico dos pacientes da clínica.
        </Typography>
      </Box>
      <PatientManagement />
    </Stack>
  );
};

export default PacientesPage;
