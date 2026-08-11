import type { Metadata } from "next";
import Link from "next/link";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";

import { LogoMark } from "@/components/ui/logo";
import { RegisterForm } from "@/features/auth/components/RegisterForm";

export const metadata: Metadata = {
  title: "Criar conta — Crivo",
};

const RegisterPage = () => {
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
      <Box sx={{ width: "100%", maxWidth: 440 }}>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
          <Link
            href="/"
            aria-label="Crivo — início"
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            <LogoMark />
            <Typography variant="h5" component="span" sx={{ color: "text.primary" }}>
              Crivo
            </Typography>
          </Link>
        </Box>

        <Card variant="outlined" sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Crie a conta da sua clínica
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
            Leva menos de um minuto. Você já entra direto no painel.
          </Typography>
          <RegisterForm />
        </Card>

        <Typography
          variant="body2"
          sx={{ color: "text.secondary", textAlign: "center", mt: 3 }}
        >
          Já tem conta?{" "}
          <Link href="/login" style={{ fontWeight: 600 }}>
            Entrar
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default RegisterPage;
