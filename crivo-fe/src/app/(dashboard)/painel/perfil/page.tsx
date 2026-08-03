import type { Metadata } from "next";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { getTenantAction } from "@/features/tenant/actions/get-tenant-action";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Meu perfil — Crivo",
};

const ROLE_LABELS: Record<"ADMIN" | "STAFF", string> = {
  ADMIN: "Administrador",
  STAFF: "Recepção",
};

const PerfilPage = async () => {
  const session = await getSession();
  const tenantResult = await getTenantAction();
  const tenantName = tenantResult.success ? tenantResult.data.name : null;

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6">Meu perfil</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Dados da sua conta nesta clínica.
        </Typography>
      </Box>

      <Card variant="outlined" sx={{ p: 3, maxWidth: 480 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Nome
            </Typography>
            <Typography variant="body1">
              {session?.displayName ?? "—"}
            </Typography>
          </Box>

          <Divider />

          <Box>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Papel
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <Chip
                label={session ? ROLE_LABELS[session.role] : "—"}
                size="small"
                color={session?.role === "ADMIN" ? "primary" : "default"}
              />
            </Box>
          </Box>

          <Divider />

          <Box>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Clínica
            </Typography>
            <Typography variant="body1">{tenantName ?? "—"}</Typography>
          </Box>
        </Stack>
      </Card>

      <Alert severity="info" sx={{ maxWidth: 480 }}>
        Trocar senha, avatar e outros dados da conta ainda não estão
        disponíveis — dependem de endpoints novos no backend (ver{" "}
        <Typography component="code" sx={{ fontFamily: "monospace" }}>
          docs/ROADMAP.md
        </Typography>
        ).
      </Alert>
    </Stack>
  );
};

export default PerfilPage;
