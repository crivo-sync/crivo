import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { DashboardHome } from "@/features/dashboard/components/DashboardHome";

export const metadata: Metadata = {
  title: "Painel — Crivo",
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
      <DashboardHome />
    </Stack>
  );
};

export default DashboardPage;
