import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { MessageManagement } from "@/features/messages/components/MessageManagement";

export const metadata: Metadata = {
  title: "Mensagens — Crivo",
};

const MensagensPage = () => {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6">Mensagens</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Histórico de mensagens enviadas pela clínica. O disparo é
          automático — aqui só acompanhamos o resultado.
        </Typography>
      </Box>
      <MessageManagement />
    </Stack>
  );
};

export default MensagensPage;
