import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ProfilePage } from "@/features/profile/components/ProfilePage";

export const metadata: Metadata = {
  title: "Meu perfil — Crivo",
};

const PerfilPage = () => {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6">Meu perfil</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Dados da sua conta, foto e senha.
        </Typography>
      </Box>
      <ProfilePage />
    </Stack>
  );
};

export default PerfilPage;
