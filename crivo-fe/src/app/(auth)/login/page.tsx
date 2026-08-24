import type { Metadata } from "next";
import Link from "next/link";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";

import { LogoMark } from "@/components/ui/logo";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata: Metadata = {
  title: "Entrar — Crivo Sync",
};

const LoginPage = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        px: 3,
        py: 6,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 400 }}>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
          <Link
            href="/"
            aria-label="Crivo Sync — início"
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            <LogoMark />
            <Typography variant="h5" component="span" sx={{ color: "text.primary" }}>
              Crivo Sync
            </Typography>
          </Link>
        </Box>

        <Card variant="outlined" sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Entrar na sua clínica
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
            Use o e-mail e a senha cadastrados pela sua clínica.
          </Typography>
          <LoginForm />
        </Card>
      </Box>
    </Box>
  );
};

export default LoginPage;
